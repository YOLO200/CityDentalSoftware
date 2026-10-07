import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

/** Password rules, used for both the live checklist and the submit guard. */
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { label: "At least one capital letter",  test: (p) => /[A-Z]/.test(p) },
  { label: "At least one number",          test: (p) => /[0-9]/.test(p) },
];

/**
 * Landing page for the link in an invite email.
 *
 * Supabase puts a recovery/invite token in the URL fragment and the client
 * library exchanges it for a session automatically. By the time this mounts
 * there is usually already a session — the user just has no password yet.
 *
 * Setting the password is the only thing that happens here. Role and branch
 * were decided by the admin at invite time and are already on the account;
 * the remaining personal details are collected by /setup-profile afterwards.
 */
export function AcceptInvite() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The library parses the fragment on load; onAuthStateChange covers the
    // case where that has not finished by first paint.
    const settle = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      setLinkValid(!!session);
      setEmail(session?.user?.email ?? null);
      setChecking(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (cancelled) return;
      if (session) {
        setLinkValid(true);
        setEmail(session.user?.email ?? null);
        setChecking(false);
      }
    });

    settle();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const unmet = PASSWORD_RULES.filter((r) => !r.test(password));
    if (unmet.length > 0) {
      setError(`Password needs: ${unmet.map((r) => r.label.toLowerCase()).join(", ")}.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setError(pwErr.message);
      setSaving(false);
      return;
    }

    // They have now actually signed in, so lift them out of 'Invited' — that
    // status holds zero permissions by design.
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase
        .from("profiles")
        .update({ status: "Active", last_login: new Date().toISOString() })
        .eq("id", userData.user.id);
    }

    // OnboardedRoute will route onward to /setup-profile for the rest.
    navigate("/");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">This invite link is not valid</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            It may have already been used, or it may have expired. Ask an administrator to
            send you a new invite.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Set your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email ? <>Finishing setup for <span className="font-medium">{email}</span>.</> : null}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Choose a password"
              autoComplete="new-password"
              className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <ul className="mt-1 space-y-0.5">
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li
                    key={r.label}
                    className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <span aria-hidden>{ok ? "✓" : "○"}</span>
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null); }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || !allRulesMet || password !== confirm}
            className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Set password and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
