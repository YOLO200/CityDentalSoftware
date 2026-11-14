import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./landing.css";

/**
 * Sign-in page, styled to match the landing hero (same gradient, drifting
 * blobs, navy + teal). "Forgot password?" sends a Supabase reset link that
 * opens /accept-invite, the same set-password screen invitees use.
 */

const HIGHLIGHTS = [
  "Patient records, visits and X-rays in one place",
  "Per-centre dashboards and patient tracker",
  "Invite-only accounts with role permissions",
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const err = await login(email, password);
    setIsLoading(false);
    if (err) setError(err);
    else navigate("/");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/accept-invite`,
    });
    setIsLoading(false);
    // Rate limits and bad input are worth showing; whether the address has an
    // account is not — the confirmation is the same either way.
    if (err && err.status !== 404) { setError(err.message); return; }
    setResetSent(true);
  };

  const switchMode = (next: "login" | "reset") => {
    setMode(next);
    setError(null);
    setResetSent(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eef2fb] via-[#f6f8fc] to-white text-gray-800">
      {/* Same backdrop as the landing hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="landing-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1e2d5a]/15" />
        <div className="landing-blob absolute right-0 top-32 h-80 w-80 rounded-full bg-teal-300/30" style={{ animationDelay: "-6s" }} />
        <div className="landing-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200/40" style={{ animationDelay: "-12s" }} />
      </div>

      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/welcome" className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2d5a] text-sm font-bold text-white transition-transform group-hover:rotate-6">D</span>
            <span className="text-lg font-semibold text-[#1e2d5a]">Dentosys</span>
          </Link>
          <Link to="/welcome" className="group flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1e2d5a]">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:pt-16">
        {/* Left: brand message (desktop) */}
        <section className="hidden lg:block">
          <div className="reveal-now">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-medium text-teal-800 backdrop-blur">
              Staff sign-in
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1e2d5a] xl:text-5xl">
              Welcome back to your practice.
            </h1>
            <p className="mt-4 max-w-md text-lg text-gray-600">
              Pick up where the clinic left off: today's appointments, pending treatment plans and patients due for recall.
            </p>
          </div>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((t, i) => (
              <li
                key={t}
                className="reveal-now flex items-center gap-3 text-gray-700"
                style={{ "--reveal-delay": `${200 + i * 120}ms` } as React.CSSProperties}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <Check className="h-4 w-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Right: the form */}
        <section className="reveal-now mx-auto w-full max-w-md" style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#1e2d5a]/10 backdrop-blur-xl sm:p-10">
            {mode === "login" ? (
              <>
                <h2 className="text-2xl font-bold text-[#1e2d5a]">Sign in</h2>
                <p className="mt-1 text-sm text-gray-500">Use the email your clinic invited you with.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#1e2d5a]">Reset your password</h2>
                <p className="mt-1 text-sm text-gray-500">We'll email you a link to set a new one.</p>
              </>
            )}

            {error && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === "reset" && resetSent ? (
              <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-sm text-teal-900">
                <MailCheck className="mb-2 h-6 w-6 text-teal-700" />
                If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset link is on its way. Open it on this device to choose a new password.
              </div>
            ) : (
              <form onSubmit={mode === "login" ? handleLogin : handleReset} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@clinic.com"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {mode === "login" && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <button type="button" onClick={() => switchMode("reset")} className="text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e2d5a] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#1e2d5a]/20 transition hover:-translate-y-0.5 hover:bg-[#162048] disabled:translate-y-0 disabled:opacity-60"
                >
                  {mode === "login"
                    ? (isLoading ? "Signing in…" : "Sign in")
                    : (isLoading ? "Sending…" : "Send reset link")}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
            )}

            {mode === "reset" && (
              <button type="button" onClick={() => switchMode("login")} className="mt-5 flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            )}

            {/* No self-serve signup: accounts exist only when an administrator invites them. */}
            <div className="mt-8 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
              New here? Accounts are created by your clinic administrator.{" "}
              <Link to="/welcome#get-access" className="font-medium text-teal-700 hover:underline">How to get access</Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Dentosys. All rights reserved.</p>
        </section>
      </main>
    </div>
  );
}
