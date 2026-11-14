import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileImage,
  KeyRound,
  LayoutDashboard,
  Lock,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./landing.css";

/**
 * Public landing page (/welcome). Logged-out visitors to "/" are sent here by
 * ProtectedRoute. Describe only what the product actually does today — no
 * messaging, billing or integrations that aren't connected.
 *
 * Palette: navy #1e2d5a (matches the app) with a teal accent. White text sits
 * on teal-700 (#0f766e) for contrast; lighter teals are decorative only.
 */

// ─── Content ──────────────────────────────────────────────────────────────────

const ROTATING_WORDS = ["front desks", "dentists", "clinic owners", "multi-branch teams"];

const FEATURES = [
  { icon: LayoutDashboard, title: "Practice dashboard", body: "Patients, today's appointments, revenue this month and pending payments for the selected centre, plus a six-month practice summary with net amount, lab charges and treatment counts." },
  { icon: Users, title: "Patient records", body: "Register patients with a unique patient ID, then keep contact details, medical history, allergies, habits, insurance and emergency contacts in one editable profile." },
  { icon: Stethoscope, title: "Clinical visits", body: "Record each visit: complaints, observations, diagnosis, treatment plan and treatment done by tooth (FDI numbering), packages, prescriptions and aftercare instructions." },
  { icon: FileImage, title: "X-rays & documents", body: "Upload intra-oral photos, X-rays, OPGs, lab reports and consent forms to each patient, sorted into folders and viewable full-screen." },
  { icon: CalendarDays, title: "Appointment calendar", body: "Book, reschedule and track appointments by doctor, with statuses from scheduled to completed, no-shows and cancellations." },
  { icon: ClipboardList, title: "Patient tracker", body: "See who needs a call: prospects, no-shows, cancellations, consulted-but-not-started, pending treatment plans, treatments in progress and patients due for recall." },
  { icon: Megaphone, title: "Enquiries & CRM", body: "Capture enquiries at the desk or at camps, import them from CSV, assign a sales owner and follow-up date, and move opportunities through a pipeline." },
  { icon: BarChart3, title: "Reports", body: "Patient and appointment reports by date range, doctor and source, so you can see where patients come from and how each chair is used." },
];

const MARQUEE = [
  "Patient records", "Clinical visits", "FDI tooth charting", "X-rays & OPGs", "Prescriptions",
  "Appointment calendar", "Patient tracker", "Recalls", "Enquiry CSV import", "Opportunity pipeline",
  "Per-centre dashboards", "Role permissions",
];

const JOURNEY = [
  { step: "Enquiry", text: "Captured from a call, walk-in, camp or CSV upload." },
  { step: "Appointment", text: "Booked on the calendar with the right doctor." },
  { step: "Visit", text: "Findings, plan and prescriptions recorded chair-side." },
  { step: "Treatment", text: "Progress tracked tooth by tooth until it's done." },
  { step: "Recall", text: "Flagged automatically when it's time to come back." },
];

const SECURITY = [
  { icon: KeyRound, title: "Invite-only accounts", body: "No public sign-ups. Staff join only when an administrator invites them, and must set a strong password." },
  { icon: UserCheck, title: "Roles & permissions", body: "Decide what each role can view, create, edit or delete — module by module." },
  { icon: Building2, title: "Branch-level access", body: "Staff see only the patients and data of the centres they're assigned to." },
  { icon: Lock, title: "Private medical files", body: "X-rays and documents are stored privately and opened through short-lived links." },
];

const CHIPS = [
  { icon: Megaphone, text: "New enquiry · Instagram", pos: "-left-6 top-16", delay: "0s" },
  { icon: FileImage, text: "OPG uploaded · #100482", pos: "-right-6 bottom-28", delay: "3s" },
  { icon: Bell, text: "12 patients due for recall", pos: "-left-4 bottom-10", delay: "6s" },
];

const BARS = [42, 58, 74, 52, 68, 90];

// ─── Motion helpers ───────────────────────────────────────────────────────────

/** Set when a public demo account exists (see Login and migrations 025/026). */
const HAS_DEMO = Boolean(import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Becomes true the first time the element scrolls into view. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/**
 * Fades content up as it scrolls into view. `immediate` is for the hero: it
 * animates on load with CSS alone instead of waiting for the observer.
 */
function Reveal({ children, delay = 0, className = "", immediate = false }: {
  children: ReactNode; delay?: number; className?: string; immediate?: boolean;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${immediate ? "reveal-now" : `reveal ${visible ? "is-visible" : ""}`} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Counts from 0 to `target` once `start` is true. Steps on timers rather than
 * requestAnimationFrame, which some environments pause — the number must
 * always end up at its target.
 */
function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) { setValue(target); return; }
    const steps = 40;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      const p = n / steps;
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (n >= steps) window.clearInterval(id);
    }, durationMs / steps);
    return () => window.clearInterval(id);
  }, [target, start, durationMs]);
  return value;
}

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % ROTATING_WORDS.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span key={i} className="landing-word inline-block text-teal-600">
        {ROTATING_WORDS[i]}
      </span>
    </span>
  );
}

// ─── Hero product sketch ──────────────────────────────────────────────────────

function ProductSketch() {
  const { ref, visible } = useInView<HTMLDivElement>();
  const patients = useCountUp(1284, visible);
  const today = useCountUp(32, visible, 900);
  const revenue = useCountUp(41, visible);
  const pending = useCountUp(62, visible);

  const stats: [string, string][] = [
    ["Patients", patients.toLocaleString("en-IN")],
    ["Today", String(today)],
    ["Revenue", `₹${(revenue / 10).toFixed(1)}L`],
    ["Pending", `₹${pending}K`],
  ];

  return (
    <div ref={ref} aria-hidden="true" className={`relative ${visible ? "is-visible" : ""}`}>
      <div className="landing-float rounded-2xl border border-white/60 bg-white/90 p-4 shadow-2xl shadow-[#1e2d5a]/15 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#1e2d5a]">
            <span className="relative flex h-2 w-2">
              <span className="landing-ping absolute inline-flex h-full w-full rounded-full bg-teal-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            Dashboard
          </span>
          <span className="rounded-md border border-gray-200 px-2 py-1 text-[10px] text-gray-500">Speedwell Premium Division</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-gray-100 bg-[#f8fafc] p-2">
              <div className="text-[10px] text-gray-500">{k}</div>
              <div className="text-sm font-semibold tabular-nums text-[#1e2d5a]">{v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] text-gray-500">
            <span>Practice summary</span>
            <span className="flex items-center gap-1 text-teal-700"><Sparkles className="h-3 w-3" /> +18% this month</span>
          </div>
          <div className="flex h-32 items-end gap-3">
            {BARS.map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className="landing-bar flex flex-col justify-end"
                  style={{ height: `${h}%`, "--bar-delay": `${200 + i * 110}ms` } as CSSProperties}
                >
                  <div className="h-[18%] rounded-t bg-[#dbeafe]" />
                  <div className={`h-[82%] ${i === BARS.length - 1 ? "bg-teal-500" : "bg-[#60a5fa]"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity chips, shown one after another */}
      {CHIPS.map(({ icon: Icon, text, pos, delay }) => (
        <div
          key={text}
          className={`landing-chip absolute hidden items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-medium text-[#1e2d5a] shadow-lg sm:flex ${pos}`}
          style={{ "--chip-delay": delay } as CSSProperties}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {text}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Landing() {
  const { user } = useAuth();
  // Signed-in staff who land here get a way back in rather than a login prompt.
  const primary = user ? { to: "/", label: "Open dashboard" } : { to: "/login", label: "Log in" };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const journey = useInView<HTMLOListElement>();

  // Client-side navigation to /welcome#section doesn't scroll by itself.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-800">
      {/* Nav */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? "border-b border-gray-100 bg-white/85 shadow-sm backdrop-blur" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/welcome" className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2d5a] text-sm font-bold text-white transition-transform group-hover:rotate-6">D</span>
            <span className="text-lg font-semibold text-[#1e2d5a]">Dentosys</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            {[["#features", "Features"], ["#workflow", "Workflow"], ["#security", "Security"]].map(([href, label]) => (
              <a key={href} href={href} className="relative py-1 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-teal-500 after:transition-transform hover:text-[#1e2d5a] hover:after:scale-x-100">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to={primary.to} className="rounded-lg px-3 py-2 text-sm font-medium text-[#1e2d5a] hover:bg-gray-100">
              {primary.label}
            </Link>
            <a href="#get-access" className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md">
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Hero — pulled up under the transparent nav */}
      <section className="relative -mt-[57px] overflow-hidden bg-gradient-to-b from-[#eef2fb] via-[#f6f8fc] to-white pt-[57px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="landing-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1e2d5a]/15" />
          <div className="landing-blob absolute right-0 top-32 h-80 w-80 rounded-full bg-teal-300/30" style={{ animationDelay: "-6s" }} />
          <div className="landing-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200/40" style={{ animationDelay: "-12s" }} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <Reveal immediate>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-medium text-teal-800 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Practice management for dental clinics
              </p>
            </Reveal>
            <Reveal immediate delay={80}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1e2d5a] sm:text-5xl">
                Run every chair, every centre, from one place.
                <span className="mt-2 block text-3xl sm:text-4xl">
                  Built for <RotatingWord />
                </span>
              </h1>
            </Reveal>
            <Reveal immediate delay={160}>
              <p className="mt-5 max-w-xl text-lg text-gray-600">
                Dentosys brings patient records, clinical visits, X-rays, appointments and patient follow-up together, for single clinics and multi-branch practices alike.
              </p>
            </Reveal>
            <Reveal immediate delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={primary.to} className="group flex items-center gap-2 rounded-lg bg-[#1e2d5a] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#1e2d5a]/20 transition hover:-translate-y-0.5 hover:bg-[#162048]">
                  {primary.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {HAS_DEMO ? (
                  <Link to="/login#demo" className="rounded-lg border border-teal-300 bg-white/70 px-5 py-3 text-sm font-medium text-teal-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-500">
                    Try the live demo
                  </Link>
                ) : (
                  <a href="#get-access" className="rounded-lg border border-gray-300 bg-white/70 px-5 py-3 text-sm font-medium text-[#1e2d5a] backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-400">
                    Get access
                  </a>
                )}
              </div>
            </Reveal>
            <Reveal immediate delay={320}>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {["Invite-only accounts", "Branch-level access", "Private X-ray storage"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-teal-600" /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal immediate delay={200}>
            <ProductSketch />
          </Reveal>
        </div>
      </section>

      {/* Capability marquee */}
      <section aria-label="Capabilities" className="border-y border-gray-100 bg-white py-4">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="landing-marquee flex w-max gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} aria-hidden={i >= MARQUEE.length} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Features</p>
          <h2 className="mt-2 text-3xl font-bold text-[#1e2d5a] sm:text-4xl">Everything the front desk and the chair need</h2>
          <p className="mt-3 max-w-2xl text-gray-600">From the first phone call to the recall six months later, each step lives in the same system.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 4) * 90}>
              <div className="group h-full rounded-2xl border border-gray-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1f8] text-[#1e2d5a] transition-colors duration-300 group-hover:bg-teal-700 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mb-2 font-semibold text-[#1e2d5a]">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative scroll-mt-20 overflow-hidden bg-[#1e2d5a] text-white">
        <div aria-hidden="true" className="landing-blob pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-400/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">Workflow</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">One patient journey, start to finish</h2>
            <p className="mt-3 max-w-2xl text-blue-100">Nothing falls between systems, and the Patient Tracker shows who is stuck at which step.</p>
          </Reveal>
          <ol ref={journey.ref} className={`relative mt-14 grid gap-4 md:grid-cols-5 ${journey.visible ? "is-visible" : ""}`}>
            {/* Connector behind the step numbers (desktop) */}
            <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-[38px] hidden h-0.5 md:block">
              <div className="landing-line h-full w-full bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400" />
            </div>
            {JOURNEY.map(({ step, text }, i) => (
              <li
                key={step}
                className={`reveal relative rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/[0.12] ${journey.visible ? "is-visible" : ""}`}
                style={{ "--reveal-delay": `${150 + i * 140}ms` } as CSSProperties}
              >
                <span className="relative z-10 mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white ring-4 ring-[#1e2d5a]">
                  {i + 1}
                </span>
                <h3 className="mb-1 font-semibold">{step}</h3>
                <p className="text-sm text-blue-100">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Multi-branch */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Multi-branch</p>
          <h2 className="mt-2 text-3xl font-bold text-[#1e2d5a] sm:text-4xl">Built for practices with more than one centre</h2>
          <p className="mt-3 text-gray-600">
            Switch centres from the header and every screen follows: dashboard figures, patient lists, calendar and enquiries. Each staff member works only in the centres they're assigned to.
          </p>
        </Reveal>
        <ul className="space-y-3">
          {["Per-centre dashboards and reports", "Patients belong to a centre and can be transferred", "Visits record which centre and doctor saw the patient", "Enquiries and follow-ups owned per centre"].map((t, i) => (
            <li key={t}>
              <Reveal delay={i * 100}>
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 transition hover:translate-x-1 hover:border-teal-200 hover:shadow-md">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="pt-1">{t}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Security */}
      <section id="security" className="scroll-mt-20 bg-[#f4f6fb]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#1e2d5a] text-white">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="text-3xl font-bold text-[#1e2d5a] sm:text-4xl">Patient data stays where it belongs</h2>
            </div>
            <p className="mt-3 max-w-2xl text-gray-600">Access is enforced by the database itself, not just hidden in the interface.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="group h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Icon className="mb-3 h-6 w-6 text-teal-600 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="mb-2 font-semibold text-[#1e2d5a]">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Get access (the "Sign up" target — accounts are invite-only) */}
      <section id="get-access" className="scroll-mt-20 px-4 py-24 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e2d5a] via-[#1e3a6a] to-teal-800 p-8 text-center text-white shadow-2xl sm:p-12">
            <div aria-hidden="true" className="landing-blob pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-teal-400/25" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Getting access</h2>
              <p className="mx-auto mt-4 max-w-2xl text-blue-100">
                Dentosys accounts are invite-only. Your clinic administrator adds you from <span className="font-semibold text-white">Settings → Users</span>, and you'll receive an email to set your password.
              </p>
              <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                  <h3 className="mb-1 font-semibold">Already invited?</h3>
                  <p className="mb-4 text-sm text-blue-100">Open the link in your invitation email to set your password, then log in.</p>
                  <Link to={primary.to} className="group inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#1e2d5a] transition hover:bg-teal-50">
                    {primary.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                  <h3 className="mb-1 font-semibold">New to your clinic's system?</h3>
                  <p className="text-sm text-blue-100">Ask your clinic administrator to send you an invitation with the right role and centre.</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Dentosys. All rights reserved.</span>
          <Link to="/login" className="hover:text-teal-700">Staff login</Link>
        </div>
      </footer>
    </div>
  );
}
