import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Edit,
  Phone,
  Mail,
  Languages,
  Printer,
  Share2,
  MoreVertical,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Pencil,
  Check,
  Play,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  blood_group: string | null;
  allergies: string[] | null;
  medical_conditions: string | null;
  current_medications: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  first_visit_date: string | null;
  insurance_provider: string | null;
  policy_number: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Mock visit data ──────────────────────────────────────────────────────────

const MOCK_VISIT = {
  date: "9 Apr, 2026",
  chiefComplaint: "Scaling offer 1250 rs.\nPrivyr lead... Krishna",
  treatmentPlan: [
    { treatment: "Check Up / Consultation", charges: 500, grossAmt: 500, disc: 500, netAmt: 0, gst: 0, total: 0, note: "" },
    { treatment: "Scaling(minor calculus)", charges: 1250, grossAmt: 1250, disc: 0, netAmt: 1250, gst: 0, total: 1250, note: "Offer" },
  ],
  treatmentDone: [
    { treatment: "Check Up / Consultation", charges: 500, grossAmt: 500, disc: 500, netAmt: 0, gst: 0, total: 0 },
    { treatment: "Scaling(minor calculus)", charges: 1250, grossAmt: 1250, disc: 0, netAmt: 1250, gst: 0, total: 1250 },
  ],
  prescription: [
    { drug: "Vantej paste (Gylcerin,Silica,Calcium sodium phosphosilicate Sodium lauryl sulphate)", dosage: "Morning 1, Night 1", duration: "21 Days", qty: "", instruction: "brush twice a day" },
    { drug: "Zerodol P (Aceclofenac (100mg) +Paracetamol (325mg) (Analgesic)", dosage: "Morning 1, Noon 0, Night 1", duration: "3 Days", qty: "6", instruction: "Daily Morning 1 Night 1, After Food" },
    { drug: "Hexigel (Chlorhexidine Gluconate (1% w/w) (Antiinflammatory Gel)", dosage: "Morning 1, Noon 1, Night 1", duration: "7 Days", qty: "1", instruction: "daily use for 3-4 times on affected site" },
  ],
  receipts: [
    { voucher: "18419", mode: "Wallet", amount: 1187.50, notes: "dr palak", doctor: "Palak-City Dental Hospital" },
    { voucher: "18418", mode: "Wallet", amount: 62.50, notes: "dr cdh", doctor: "City Dental Hospital" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(dob: string | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  const dobStr = birth.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${age} years (${dobStr})`;
}

function capitalize(s: string | null) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Collapsible({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-[#1e2d5a]"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function SectionHeader({ color, title, extra }: { color: string; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-sm font-semibold tracking-wide" style={{ color: color === "bg-orange-400" ? "#f97316" : color === "bg-green-500" ? "#22c55e" : "#3b82f6" }}>
        {title}
      </span>
      {extra}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MainTab = "visits" | "docs" | "membership" | "charting";

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>("visits");
  const [socialOpen, setSocialOpen] = useState(true);
  const [internalOpen, setInternalOpen] = useState(true);
  const [addressOpen, setAddressOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPatient(data as PatientData);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Patient not found.
      </div>
    );
  }

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const genderLabel = capitalize(patient.gender);
  const ageStr = formatAge(patient.date_of_birth);
  const initials = `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase();

  // ── Left panel ──────────────────────────────────────────────────────────────

  const leftPanel = (
    <div className="w-72 flex-shrink-0 border-r border-gray-200 overflow-y-auto bg-white">
      {/* Patient header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#3b3f8c] text-white text-lg font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#3b3f8c] font-semibold text-sm leading-tight">
              {fullName}
            </div>
            {(genderLabel || ageStr) && (
              <div className="text-xs text-gray-500 mt-0.5">
                {[genderLabel, ageStr].filter(Boolean).join(" , ")}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-0.5">[Virani chowk]</div>
          </div>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-2 mt-3">
          {[FileText, Printer, Share2, Edit, MoreVertical].map((Icon, i) => (
            <button key={i} className="rounded p-1.5 hover:bg-gray-100 text-gray-500">
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* SMS/WA, Email, Letter */}
        <div className="flex items-center gap-2 mt-2">
          <button className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
            <MessageSquare className="h-3 w-3" />
            SMS/WA
          </button>
          <button className="rounded border border-gray-300 px-2 py-1 text-xs">
            <Plus className="inline h-3 w-3" />
          </button>
          <button className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
            Email
          </button>
          <button className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
            Letter
          </button>
          <button className="rounded border border-gray-300 px-2 py-1 text-xs">
            <Plus className="inline h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
        {patient.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>{patient.phone}{patient.alternate_phone ? `, ${patient.alternate_phone}` : ""}</span>
          </div>
        )}
        {patient.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Languages className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span>English</span>
        </div>
      </div>

      {/* Relationship */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1e2d5a]">Relationship</span>
          <span className="text-xs text-gray-400">
            {patient.first_visit_date
              ? new Date(patient.first_visit_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—"}
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-500">
          <div>
            <span className="text-gray-400">Source Type</span>
            <div className="text-gray-700">Instagram</div>
          </div>
          <div className="flex justify-between mt-1.5">
            <div>
              <div className="text-gray-400">Group</div>
              <div className="text-gray-700">None</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">Ratecard</div>
              <div className="text-gray-700">Standard</div>
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <div>
              <div className="text-gray-400">Membership</div>
              <div className="text-gray-700">—</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">Family</div>
              <div className="text-gray-700">—</div>
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-gray-400">Reviews</div>
          </div>
          <div className="flex gap-2 mt-1">
            {/* Google icon */}
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </button>
            {/* Instagram icon */}
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Social Notes */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setSocialOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1e2d5a]">Social Notes</span>
            <button className="rounded-full bg-gray-100 p-0.5 hover:bg-gray-200">
              <Plus className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          {socialOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {socialOpen && (
          <div className="mt-3 flex flex-col items-center text-center">
            <div className="w-20 h-20 opacity-60">
              <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="45" cy="35" r="18" fill="#e0e7ff" />
                <rect x="20" y="55" width="50" height="30" rx="8" fill="#e0e7ff" />
                <circle cx="80" cy="40" r="14" fill="#c7d2fe" />
                <rect x="62" y="58" width="38" height="24" rx="7" fill="#c7d2fe" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-1">Know your patient better.</p>
            <p className="text-xs text-gray-500">Nurture a bond.</p>
          </div>
        )}
      </div>

      {/* Internal Notes */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setInternalOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1e2d5a]">Internal Notes</span>
            <button className="rounded-full bg-gray-100 p-0.5 hover:bg-gray-200">
              <Plus className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          {internalOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {internalOpen && (
          <div className="mt-3 flex flex-col items-center text-center">
            <div className="w-20 h-20 opacity-60">
              <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="45" cy="35" r="18" fill="#fde68a" />
                <rect x="20" y="55" width="50" height="30" rx="8" fill="#fde68a" />
                <circle cx="80" cy="40" r="14" fill="#fcd34d" />
                <rect x="62" y="58" width="38" height="24" rx="7" fill="#fcd34d" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-1">Know your patient's preferences.</p>
            <p className="text-xs text-gray-500">Serve them better.</p>
          </div>
        )}
      </div>

      {/* Address */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setAddressOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="text-sm font-semibold text-[#1e2d5a]">Address</span>
          {addressOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {addressOpen && patient.address && (
          <div className="mt-2 text-xs text-gray-600">
            {[patient.address, patient.city, patient.state, patient.zip_code].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Active status */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className={`text-sm font-medium ${patient.is_active ? "text-green-600" : "text-gray-400"}`}>
          {patient.is_active ? "Active" : "Inactive"}
        </span>
        <button className="text-xs text-[#3b3f8c] hover:underline">Change</button>
      </div>
    </div>
  );

  // ── Top info strip ──────────────────────────────────────────────────────────

  const topInfo = (
    <div className="flex gap-3 border-b border-gray-200 bg-white px-5 py-3">
      {/* Medical Information */}
      <div className="flex-1 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">
            Medical Information{" "}
            <span className="font-normal text-gray-400">
              [{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}]
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Blood Group: <span className="font-semibold">{patient.blood_group || ""}</span></span>
            <Pencil className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
          </div>
        </div>
        <div className="flex gap-6 text-[#3b3f8c]">
          <button className="hover:underline">History</button>
          <button className="hover:underline">Dental</button>
          <button className="hover:underline">Allergies</button>
          <button className="hover:underline">Habits</button>
        </div>
      </div>

      {/* Contact */}
      <div className="w-52 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Contact</span>
          <Pencil className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
        </div>
        <div className="space-y-1 text-gray-500">
          <div>
            <span className="font-medium text-gray-600">Gen. Practitioner:</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Emergency:</span>{" "}
            {patient.emergency_contact_name ? `${patient.emergency_contact_name} ${patient.emergency_contact_phone ?? ""}` : ""}
          </div>
        </div>
      </div>

      {/* Payment Due */}
      <div className="w-52 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="text-gray-500 mb-1">Payment Due</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-semibold text-gray-700">INR 0.00</span>
          <button className="text-[#3b3f8c] hover:underline">Receive</button>
          <button className="text-[#3b3f8c] hover:underline">Refund</button>
        </div>
        <button className="text-[#3b3f8c] hover:underline block mb-1">Send Payment Link</button>
        <div className="text-gray-400">Unbilled INR 1,250.00</div>
      </div>
    </div>
  );

  // ── Visits tab ──────────────────────────────────────────────────────────────

  const visitsTab = (
    <div className="px-5 py-4 space-y-4">
      {/* Date header */}
      <div className="flex items-center gap-3">
        <span className="rounded bg-orange-400 px-3 py-1 text-xs font-semibold text-white">
          {MOCK_VISIT.date}
        </span>
        <Printer className="h-4 w-4 text-gray-400 cursor-pointer" />
        <button className="ml-auto text-xs text-[#3b3f8c] hover:underline">Expand latest visit only</button>
      </div>

      {/* Clinical Note */}
      <SectionHeader color="bg-orange-400" title="CLINICAL NOTE" extra={<Printer className="ml-auto h-3.5 w-3.5 text-gray-400 cursor-pointer" />} />
      <div className="overflow-x-auto rounded border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {["#", "Surface", "Pop", "TOP", "Pulp Sensibility", "Conclusion", "Files"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-[10px]">+</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Chief Complaint</div>
                    <div className="text-gray-500 whitespace-pre-line">{MOCK_VISIT.chiefComplaint}</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Treatment Plan */}
      <SectionHeader color="bg-orange-400" title="TREATMENT PLAN" extra={<Printer className="ml-auto h-3.5 w-3.5 text-gray-400 cursor-pointer" />} />
      <div className="overflow-x-auto rounded border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {["Treatment", "Charges", "Gross Amt", "Disc", "Net Amt", "GST", "Total", "Note", "Files"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-3 py-1.5 text-gray-500 italic text-[11px]" colSpan={9}>Treatment Plan A</td>
            </tr>
            {MOCK_VISIT.treatmentPlan.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 bg-orange-50/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Play className="h-2 w-2 text-gray-500" />
                    </div>
                    {row.treatment}
                  </div>
                </td>
                <td className="px-3 py-2">{row.charges.toFixed(2)} × 1</td>
                <td className="px-3 py-2">{row.grossAmt.toFixed(2)}</td>
                <td className="px-3 py-2">{row.disc.toFixed(2)}</td>
                <td className="px-3 py-2">{row.netAmt.toFixed(2)}</td>
                <td className="px-3 py-2">{row.gst.toFixed(2)}</td>
                <td className="px-3 py-2">{row.total.toFixed(2)}</td>
                <td className="px-3 py-2 text-gray-400">{row.note}</td>
                <td className="px-3 py-2" />
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
              <td className="px-3 py-2 text-right" colSpan={2}>Total</td>
              <td className="px-3 py-2">1,750.00</td>
              <td className="px-3 py-2">500.00</td>
              <td className="px-3 py-2">1,250.00</td>
              <td className="px-3 py-2">0.00</td>
              <td className="px-3 py-2">1,250.00</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Treatment Done */}
      <SectionHeader color="bg-green-500" title="TREATMENT DONE" extra={<Printer className="ml-auto h-3.5 w-3.5 text-gray-400 cursor-pointer" />} />
      <div className="overflow-x-auto rounded border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {["Treatment", "Charges", "Gross Amt", "Disc", "Net Amt", "GST", "Total", "Bill", "Files"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_VISIT.treatmentDone.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-gray-500" />
                    </div>
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Play className="h-2 w-2 text-gray-500" />
                    </div>
                    {row.treatment}
                  </div>
                </td>
                <td className="px-3 py-2">{row.charges.toFixed(2)} × 1</td>
                <td className="px-3 py-2">{row.grossAmt.toFixed(2)}</td>
                <td className="px-3 py-2">{row.disc.toFixed(2)}</td>
                <td className="px-3 py-2">{row.netAmt.toFixed(2)}</td>
                <td className="px-3 py-2">{row.gst.toFixed(2)}</td>
                <td className="px-3 py-2">{row.total.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <input type="checkbox" className="accent-[#3b3f8c]" />
                </td>
                <td className="px-3 py-2" />
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
              <td className="px-3 py-2 text-right" colSpan={2}>Total</td>
              <td className="px-3 py-2">1,750.00</td>
              <td className="px-3 py-2">500.00</td>
              <td className="px-3 py-2">1,250.00</td>
              <td className="px-3 py-2">0.00</td>
              <td className="px-3 py-2">1,250.00</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Prescription */}
      <SectionHeader color="bg-blue-500" title="PRESCRIPTION" extra={
        <div className="ml-auto flex gap-2">
          <button className="rounded p-1 hover:bg-gray-100"><Share2 className="h-3.5 w-3.5 text-gray-400" /></button>
          <button className="rounded p-1 hover:bg-gray-100"><Printer className="h-3.5 w-3.5 text-gray-400" /></button>
        </div>
      } />
      <div className="overflow-x-auto rounded border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {["Drug", "Dosage", "Duration", "Total Qty", "Instruction"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_VISIT.prescription.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 max-w-[220px]">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-400 text-[9px]">Rx</span>
                    </div>
                    <span className="leading-tight">{row.drug}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-600">{row.dosage}</td>
                <td className="px-3 py-2">{row.duration}</td>
                <td className="px-3 py-2">{row.qty}</td>
                <td className="px-3 py-2 text-gray-600">{row.instruction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipts */}
      <SectionHeader color="bg-green-500" title="RECEIPTS, REFUNDS, CREDIT NOTES" />
      <div className="overflow-x-auto rounded border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {["Voucher #", "Mode", "Amount", "Particulars", "Doctor"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-3 py-1.5 text-green-600 italic text-[11px]" colSpan={5}>Receipts</td>
            </tr>
            {MOCK_VISIT.receipts.map((row, i) => (
              <>
                <tr key={`r-${i}`} className="border-t border-gray-100">
                  <td className="px-3 py-2">{row.voucher}</td>
                  <td className="px-3 py-2">{row.mode}</td>
                  <td className="px-3 py-2">{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>{row.doctor}</span>
                      <div className="flex gap-1">
                        <Share2 className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
                        <Printer className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
                        <MoreVertical className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr key={`n-${i}`} className="border-t border-gray-50 bg-gray-50/50">
                  <td className="px-3 py-1.5 text-gray-400 text-[11px]">Notes</td>
                  <td className="px-3 py-1.5 text-gray-500 text-[11px]" colSpan={4}>{row.notes}</td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pt-2">
        <button className="rounded border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Get Lifetime Data
        </button>
      </div>
    </div>
  );

  // ── Docs & Images tab ───────────────────────────────────────────────────────

  const docsTab = (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3 overflow-x-auto">
        {["All", "Documents", "Photos", "X-Rays", "Lab Reports", "OPG/CEPH", "3D Files", "Ortho Pre Treatment", "Consent Form"].map((t, i) => (
          <button
            key={t}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded ${i === 0 ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a] font-semibold" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
        <button className="ml-auto flex-shrink-0 rounded bg-[#3b3f8c] px-3 py-1.5 text-xs text-white hover:bg-[#2d3170]">
          Create Folder
        </button>
      </div>
      <div className="text-center text-gray-400 text-sm py-16">No documents uploaded yet.</div>
    </div>
  );

  // ── Membership tab ──────────────────────────────────────────────────────────

  const membershipTab = (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-2xl text-gray-300 font-light">Membership not purchased yet</p>
      <button className="h-12 w-12 rounded-full bg-[#1e2d5a] flex items-center justify-center text-white hover:bg-[#162048] shadow-lg">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );

  // ── Charting tab ────────────────────────────────────────────────────────────

  const chartingTab = (
    <div className="px-5 py-4">
      <div className="flex gap-6 border-b border-gray-200 mb-4">
        {["RESTORATIVE CHARTING", "PERIO CHARTING"].map((t, i) => (
          <button
            key={t}
            className={`pb-2.5 text-xs font-semibold tracking-wide ${i === 0 ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="font-semibold text-sm text-gray-700 mb-6">Charting List</div>
      <div className="text-center text-2xl text-gray-300 font-light py-16">
        Looks like there's nothing to show here
      </div>
    </div>
  );

  // ── Full render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/patients")}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Body: left panel + right content */}
      <div className="flex flex-1 overflow-hidden">
        {leftPanel}

        {/* Right side */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {topInfo}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            {(["visits", "docs", "membership", "charting"] as MainTab[]).map((tab) => {
              const label = { visits: "VISITS", docs: "DOCS & IMAGES", membership: "MEMBERSHIP", charting: "CHARTING" }[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-xs font-semibold tracking-wide transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "visits" && visitsTab}
            {activeTab === "docs" && docsTab}
            {activeTab === "membership" && membershipTab}
            {activeTab === "charting" && chartingTab}
          </div>
        </div>
      </div>
    </div>
  );
}
