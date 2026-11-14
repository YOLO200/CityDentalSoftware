import * as Sentry from "@sentry/react";

/**
 * Error reporting. Off unless VITE_SENTRY_DSN is set, so local dev and tests
 * send nothing.
 *
 * This app handles patient records, so the rule is: errors leave the browser,
 * patient data does not.
 *   - No Session Replay and no performance tracing (both would capture
 *     screens / request URLs full of patient details).
 *   - Query strings are stripped from every URL: PostgREST puts filters there
 *     (`?phone=ilike.*98765*`, `?first_name=...`).
 *   - Request bodies, cookies and Postgres `details` (which can echo the
 *     offending row) are never sent.
 *   - The user is identified by id only — no email or name.
 */

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
export const sentryEnabled = Boolean(dsn);

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Origin + path only. */
export function scrubUrl(url: string): string {
  try {
    const u = new URL(url, "http://relative.invalid");
    return u.origin === "http://relative.invalid" ? u.pathname : `${u.origin}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    sendDefaultPii: false,
    // Default integrations only: no browserTracingIntegration, no replay.
    beforeBreadcrumb(crumb) {
      // Console output can contain anything the code logged; keep only
      // warnings and errors, which are what explain a crash.
      if (crumb.category === "console" && crumb.level !== "error" && crumb.level !== "warning") return null;
      if (crumb.data && typeof crumb.data.url === "string") crumb.data.url = scrubUrl(crumb.data.url);
      if (crumb.data && typeof crumb.data.to === "string") crumb.data.to = scrubUrl(crumb.data.to);
      if (crumb.data && typeof crumb.data.from === "string") crumb.data.from = scrubUrl(crumb.data.from);
      return crumb;
    },
    beforeSend(event) {
      if (event.request) {
        if (event.request.url) event.request.url = scrubUrl(event.request.url);
        delete event.request.query_string;
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },
  });
}

/** Called from AuthContext on sign-in / sign-out. Id only, never email. */
export function setSentryUser(id: string | null) {
  if (!sentryEnabled) return;
  Sentry.setUser(id ? { id } : null);
}

// ─── Supabase error handler ──────────────────────────────────────────────────

/**
 * Postgres / PostgREST codes that mean the *code* is wrong — a column, table,
 * function or enum value that does not exist, or a constraint the UI should
 * have validated. These are the bugs that otherwise surface as "No receipts
 * recorded" and a phone call from the clinic.
 *
 * Deliberately NOT here: 42501 / RLS refusals (expected when a role lacks a
 * permission), 23505 unique violations (duplicate input), auth failures.
 */
const BUG_CODES = new Set([
  "42703", // undefined column
  "42809", // wrong object type (e.g. selecting a column that resolves to a function)
  "42P01", // undefined table
  "42883", // undefined function
  "22P02", // invalid enum / uuid literal — usually a form offering a value the DB rejects
  "23502", // not-null violation
  "23503", // foreign-key violation
  "23514", // check violation
  "PGRST200", "PGRST201", // bad embed / relationship
  "PGRST202", // function not found
  "PGRST204", // column not found (insert/update)
  "PGRST205", // table not found
]);

/** Group by endpoint, not by row id. */
const endpointOf = (url: string) => scrubUrl(url).replace(UUID, ":id");

export function reportSupabaseError(info: {
  method: string;
  url: string;
  status: number;
  code?: string;
  message?: string;
}) {
  if (!sentryEnabled) return;
  const endpoint = endpointOf(info.url);
  const code = info.code ?? String(info.status);
  Sentry.captureMessage(`Supabase ${code} on ${info.method} ${endpoint}: ${info.message ?? "request failed"}`, {
    level: "error",
    tags: { source: "supabase", supabase_code: code, http_status: String(info.status) },
    extra: { method: info.method, endpoint },
    fingerprint: ["supabase", info.method, endpoint, code],
  });
}

/**
 * Passed to createClient as its fetch. Reports server errors (5xx) and
 * bug-class 4xx responses, then hands the response back untouched — callers
 * still see exactly what they saw before.
 */
export const monitoredFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!sentryEnabled || response.status < 400) return response;

  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

  // Read a clone so the caller's body stream is unaffected; never block on it.
  response
    .clone()
    .json()
    .catch(() => null)
    .then((body: { code?: string; message?: string; error?: string } | null) => {
      const code = body?.code;
      if (response.status >= 500 || (code && BUG_CODES.has(code))) {
        reportSupabaseError({ method, url, status: response.status, code, message: body?.message ?? body?.error });
      }
    });

  return response;
};
