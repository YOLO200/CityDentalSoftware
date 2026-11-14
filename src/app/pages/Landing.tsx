import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  FileImage,
  KeyRound,
  LayoutDashboard,
  Lock,
  Megaphone,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

/**
 * Public landing page (/welcome). Logged-out visitors to "/" are sent here by
 * ProtectedRoute. Describe only what the product actually does today — no
 * messaging, billing or integrations that aren't connected.
 */

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Practice dashboard",
    body: "Patients, today's appointments, revenue this month and pending payments for the selected centre, plus a six-month practice summary with net amount, lab charges and treatment counts.",
  },
  {
    icon: Users,
    title: "Patient records",
    body: "Register patients with a unique patient ID, then keep contact details, medical history, allergies, habits, insurance and emergency contacts in one editable profile.",
  },
  {
    icon: Stethoscope,
    title: "Clinical visits",
    body: "Record each visit: complaints, observations, diagnosis, treatment plan and treatment done by tooth (FDI numbering), packages, prescriptions and aftercare instructions.",
  },
  {
    icon: FileImage,
    title: "X-rays & documents",
    body: "Upload intra-oral photos, X-rays, OPGs, lab reports and consent forms to each patient, sorted into folders and viewable full-screen.",
  },
  {
    icon: CalendarDays,
    title: "Appointment calendar",
    body: "Book, reschedule and track appointments by doctor, with statuses from scheduled to completed, no-shows and cancellations.",
  },
  {
    icon: ClipboardList,
    title: "Patient tracker",
    body: "See who needs a call: prospects, no-shows, cancellations, consulted-but-not-started, pending treatment plans, treatments in progress and patients due for recall.",
  },
  {
    icon: Megaphone,
    title: "Enquiries & CRM",
    body: "Capture enquiries at the desk or at camps, import them from CSV, assign a sales owner and follow-up date, and move opportunities through a pipeline.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Patient and appointment reports by date range, doctor and source, so you can see where patients come from and how each chair is used.",
  },
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

export function Landing() {
  const { user } = useAuth();
  // Signed-in staff who land here get a way back in rather than a login prompt.
  const primary = user ? { to: "/", label: "Open dashboard" } : { to: "/login", label: "Log in" };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/welcome" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2d5a] text-sm font-bold text-white">D</span>
            <span className="text-lg font-semibold text-[#1e2d5a]">Dentosys</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            <a href="#features" className="hover:text-[#1e2d5a]">Features</a>
            <a href="#workflow" className="hover:text-[#1e2d5a]">Workflow</a>
            <a href="#security" className="hover:text-[#1e2d5a]">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={primary.to} className="rounded-lg px-3 py-2 text-sm font-medium text-[#1e2d5a] hover:bg-gray-50">
              {primary.label}
            </Link>
            <a href="#get-access" className="rounded-lg bg-[#f97316] px-3 py-2 text-sm font-medium text-white hover:bg-[#ea580c]">
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f4f6fb] to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-[#c2410c]">
              Practice management for dental clinics
            </p>
            <h1 className="text-4xl font-bold leading-tight text-[#1e2d5a] sm:text-5xl">
              Run every chair, every centre, from one place.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-600">
              Dentosys brings patient records, clinical visits, X-rays, appointments and patient follow-up together, for single clinics and multi-branch practices alike.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={primary.to} className="flex items-center gap-2 rounded-lg bg-[#1e2d5a] px-5 py-3 text-sm font-medium text-white hover:bg-[#162048]">
                {primary.label} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#get-access" className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-[#1e2d5a] hover:bg-gray-50">
                Get access
              </a>
            </div>
          </div>

          {/* Product sketch — decorative, built from the app's own visual language */}
          <div aria-hidden="true" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1e2d5a]">Dashboard</span>
              <span className="rounded-md border border-gray-200 px-2 py-1 text-[10px] text-gray-500">Speedwell Premium Division</span>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Patients", "1,284"], ["Today", "32"], ["Revenue", "₹4.1L"], ["Pending", "₹62K"]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-gray-100 bg-[#f8fafc] p-2">
                  <div className="text-[10px] text-gray-500">{k}</div>
                  <div className="text-sm font-semibold text-[#1e2d5a]">{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <div className="mb-2 text-[10px] text-gray-500">Practice summary</div>
              <div className="flex h-32 items-end gap-3">
                {[40, 62, 78, 55, 70, 92].map((h, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end">
                    <div className="rounded-t bg-[#dbeafe]" style={{ height: `${h * 0.18}%` }} />
                    <div className="bg-[#60a5fa]" style={{ height: `${h * 0.82}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold text-[#1e2d5a]">Everything the front desk and the chair need</h2>
        <p className="mt-3 max-w-2xl text-gray-600">From the first phone call to the recall six months later, each step lives in the same system.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef1f8] text-[#1e2d5a]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mb-2 font-semibold text-[#1e2d5a]">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="scroll-mt-16 bg-[#1e2d5a] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold">One patient journey, start to finish</h2>
          <p className="mt-3 max-w-2xl text-blue-100">Nothing falls between systems, and the Patient Tracker shows who is stuck at which step.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {JOURNEY.map(({ step, text }, i) => (
              <li key={step} className="rounded-xl bg-white/10 p-5">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f97316] text-sm font-bold">{i + 1}</span>
                <h3 className="mb-1 font-semibold">{step}</h3>
                <p className="text-sm text-blue-100">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Multi-branch */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold text-[#1e2d5a]">Built for multi-branch practices</h2>
          <p className="mt-3 text-gray-600">
            Switch centres from the header and every screen follows: dashboard figures, patient lists, calendar and enquiries. Each staff member works only in the centres they're assigned to.
          </p>
        </div>
        <ul className="space-y-3">
          {["Per-centre dashboards and reports", "Patients belong to a centre and can be transferred", "Visits record which centre and doctor saw the patient", "Enquiries and follow-ups owned per centre"].map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
              <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f97316]" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Security */}
      <section id="security" className="scroll-mt-16 bg-[#f4f6fb]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#1e2d5a]" />
            <h2 className="text-3xl font-bold text-[#1e2d5a]">Patient data stays where it belongs</h2>
          </div>
          <p className="mt-3 max-w-2xl text-gray-600">Access is enforced by the database itself, not just hidden in the interface.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-white p-5 shadow-sm">
                <Icon className="mb-3 h-5 w-5 text-[#f97316]" />
                <h3 className="mb-2 font-semibold text-[#1e2d5a]">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get access (the "Sign up" target — accounts are invite-only) */}
      <section id="get-access" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-[#1e2d5a]">Getting access</h2>
        <p className="mt-4 text-gray-600">
          Dentosys accounts are invite-only. Your clinic administrator adds you from <span className="font-medium">Settings → Users</span>, and you'll receive an email to set your password.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="mb-1 font-semibold text-[#1e2d5a]">Already invited?</h3>
            <p className="mb-4 text-sm text-gray-600">Open the link in your invitation email to set your password, then log in.</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#1e2d5a] hover:underline">
              Log in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="mb-1 font-semibold text-[#1e2d5a]">New to your clinic's system?</h3>
            <p className="text-sm text-gray-600">Ask your clinic administrator to send you an invitation with the right role and centre.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Dentosys. All rights reserved.</span>
          <Link to="/login" className="hover:text-[#1e2d5a]">Staff login</Link>
        </div>
      </footer>
    </div>
  );
}
