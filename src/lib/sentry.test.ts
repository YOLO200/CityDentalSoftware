import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => ({ init: vi.fn(), setUser: vi.fn(), captureMessage: vi.fn() }));

/** sentry.ts reads the DSN at import time, so import it after stubbing env. */
async function loadWithDsn() {
  vi.resetModules();
  vi.stubEnv("VITE_SENTRY_DSN", "https://public@o0.ingest.sentry.io/0");
  return import("./sentry");
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Sentry Supabase error handler", () => {
  beforeEach(() => vi.mocked(Sentry.captureMessage).mockClear());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("strips query strings, which carry patient names and phone numbers", async () => {
    const { scrubUrl } = await loadWithDsn();
    expect(scrubUrl("https://x.supabase.co/rest/v1/patients?phone=ilike.*98765*&first_name=eq.Ravi"))
      .toBe("https://x.supabase.co/rest/v1/patients");
    expect(scrubUrl("/patients/123?tab=docs#top")).toBe("/patients/123");
  });

  it("reports a schema bug but not a permission refusal, and passes both responses through", async () => {
    const { monitoredFetch } = await loadWithDsn();
    const bug = jsonResponse(400, { code: "42703", message: "column receipts.mode does not exist", details: "row data" });
    const refused = jsonResponse(403, { code: "42501", message: "permission denied" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(bug).mockResolvedValueOnce(refused));

    const r1 = await monitoredFetch("https://x.supabase.co/rest/v1/receipts?patient_id=eq.4f0c1a2b-1111-2222-3333-444455556666");
    const r2 = await monitoredFetch("https://x.supabase.co/rest/v1/visits", { method: "POST" });
    await new Promise((r) => setTimeout(r, 0)); // body is inspected asynchronously

    expect(r1.status).toBe(400);
    expect(await r1.json()).toMatchObject({ code: "42703" }); // caller's body still readable
    expect(r2.status).toBe(403);

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const [message, ctx] = vi.mocked(Sentry.captureMessage).mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toContain("42703");
    expect(message).not.toContain("patient_id");
    expect(JSON.stringify(ctx)).not.toContain("row data"); // Postgres `details` never sent
  });
});
