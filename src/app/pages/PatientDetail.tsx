import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Edit,
  Phone,
  Mail,
  Printer,
  Share2,
  MoreVertical,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Pencil,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { NoteModal, type NoteType, type PatientNote } from "./patient/NoteModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatientData {
  id: string;
  patient_code: string | null;
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
  branch_id: string | null;
  /** Embedded from the branches FK; null when the patient has no branch. */
  branches: { name: string } | null;
}

interface PrescriptionRow {
  id: string;
  drug_name: string | null;
  dosage: string | null;
  duration: string | null;
  quantity: string | number | null;
  instructions: string | null;
  date: string | null;
}

interface ReceiptRow {
  id: string;
  receipt_number: string | null;
  mode: string | null;
  amount: number | null;
  notes: string | null;
  date: string | null;
}

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
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>("visits");
  const [socialOpen, setSocialOpen] = useState(true);
  const [internalOpen, setInternalOpen] = useState(true);
  const [addressOpen, setAddressOpen] = useState(false);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [noteModal, setNoteModal] = useState<NoteType | null>(null);
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const { user } = useAuth();
  const { branches } = useBranch();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const [patientRes, rxRes, receiptRes, notesRes] = await Promise.all([
        supabase
          .from("patients")
          .select("*, branches(name)")
          .eq("id", id)
          .single(),
        supabase
          .from("prescriptions")
          .select("id, drug_name, dosage, duration, quantity, instructions, date")
          .eq("patient_id", id)
          .order("date", { ascending: false }),
        supabase
          .from("receipts")
          .select("id, receipt_number, mode, amount, notes, date")
          .eq("patient_id", id)
          .order("date", { ascending: false }),
        supabase
          .from("patient_notes")
          .select("id, patient_id, note_type, note_date, note, created_at")
          .eq("patient_id", id)
          .order("note_date", { ascending: false }),
      ]);

      if (cancelled) return;
      setPatient(patientRes.data as PatientData | null);
      setPrescriptions((rxRes.data as PrescriptionRow[] | null) ?? []);
      setReceipts((receiptRes.data as ReceiptRow[] | null) ?? []);
      setNotes((notesRes.data as PatientNote[] | null) ?? []);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
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
  const receiptsTotal = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  const handleBranchChange = async (nextBranchId: string) => {
    if (!nextBranchId || nextBranchId === patient.branch_id) return;
    setSavingBranch(true);
    setBranchError(null);

    const { data, error } = await supabase
      .from("patients")
      .update({ branch_id: nextBranchId })
      .eq("id", patient.id)
      .select("branch_id, branches(name)")
      .single();

    if (error) {
      setBranchError(error.message);
      setSavingBranch(false);
      return;
    }

    // An empty result means the row updated but RLS now hides it — the patient
    // was moved into a branch this user cannot read. Say so plainly instead of
    // leaving a stale branch on screen.
    if (!data) {
      setBranchError("Moved, but you no longer have access to this patient's branch.");
      setSavingBranch(false);
      return;
    }

    // PostgREST returns an object for a many-to-one embed, but the client types
    // it as an array. Accept either rather than casting blind.
    const row = data as unknown as {
      branch_id: string | null;
      branches: { name: string } | { name: string }[] | null;
    };
    const branch = Array.isArray(row.branches) ? (row.branches[0] ?? null) : row.branches;

    setPatient((prev) =>
      prev ? { ...prev, branch_id: row.branch_id, branches: branch } : prev
    );
    setSavingBranch(false);
  };

  // ── Notes panels ────────────────────────────────────────────────────────────
  // Social and Internal notes are the same panel over a different note_type.
  // Keep "+" a sibling of the collapse toggle, never nested inside it: a
  // <button> within a <button> is invalid HTML and swallows the click.

  const renderNotesPanel = (
    type: NoteType,
    title: string,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const rows = notes.filter((n) => n.note_type === type);
    return (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1e2d5a]">{title}</span>
            <button
              onClick={() => setNoteModal(type)}
              aria-label={`Add ${title.toLowerCase()}`}
              className="rounded-full bg-gray-100 p-0.5 hover:bg-gray-200"
            >
              <Plus className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
          >
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>

        {open && (
          rows.length === 0 ? (
            <div className="mt-3 text-xs text-gray-400">No notes added yet.</div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {rows.map((n) => (
                <li key={n.id} className="text-xs">
                  <div className="text-gray-400">{formatDate(n.note_date)}</div>
                  <div className="whitespace-pre-line text-gray-700">{n.note}</div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    );
  };

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
            {/* Rendered as `#000000 [Branch Name]`. Either half can be absent,
                so the space between them is only emitted when both are present. */}
            {(patient.branches?.name || patient.patient_code) && (
              <div className="text-xs text-gray-400 mt-0.5">
                {patient.patient_code && (
                  <span className="font-medium text-gray-500">#{patient.patient_code}</span>
                )}
                {patient.patient_code && patient.branches?.name ? " " : ""}
                {patient.branches?.name ? `[${patient.branches.name}]` : ""}
              </div>
            )}
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
        {!patient.phone && !patient.email && (
          <div className="text-xs text-gray-400">No contact details recorded.</div>
        )}
      </div>

      {/* Registration — only the fields that exist on the patients table.
          Source type / group / ratecard / membership / family were hardcoded
          placeholders with no backing column; removed rather than faked. */}
      {
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-[#1e2d5a] mb-2">Registration</div>
          <div className="space-y-1.5 text-xs">
            {patient.patient_code && (
              <div className="flex justify-between">
                <span className="text-gray-400">Patient ID</span>
                <span className="text-gray-700 font-medium">#{patient.patient_code}</span>
              </div>
            )}
            {/* Centre is editable: moving a patient between branches moves who
                can see them, so this is an access-control change, not a label
                edit. RLS re-checks it server-side. */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400">Center</span>
              <select
                value={patient.branch_id ?? ""}
                disabled={savingBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                aria-label="Patient's branch"
                className="max-w-[60%] truncate rounded border border-gray-200 bg-white px-1.5 py-1 text-right text-xs text-gray-700 outline-none hover:border-gray-300 focus:border-indigo-400 disabled:opacity-50"
              >
                {patient.branch_id === null && <option value="">Unassigned</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {branchError && (
              <div className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-600">
                {branchError}
              </div>
            )}
            {patient.first_visit_date && (
              <div className="flex justify-between">
                <span className="text-gray-400">Patient since</span>
                <span className="text-gray-700">
                  {new Date(patient.first_visit_date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      }

      {/* Social Notes */}
      {renderNotesPanel("social", "Social Notes", socialOpen, setSocialOpen)}

      {/* Internal Notes */}
      {renderNotesPanel("internal", "Internal Notes", internalOpen, setInternalOpen)}

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
      {/* Medical Information — renders only what the patient record holds. */}
      <div className="flex-1 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Medical Information</span>
          <div className="flex items-center gap-2">
            {patient.blood_group && (
              <span className="text-gray-500">
                Blood Group: <span className="font-semibold">{patient.blood_group}</span>
              </span>
            )}
            <Pencil className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
          </div>
        </div>
        <div className="space-y-1 text-gray-600">
          {patient.medical_conditions && (
            <div><span className="text-gray-400">History: </span>{patient.medical_conditions}</div>
          )}
          {patient.allergies && patient.allergies.length > 0 && (
            <div><span className="text-gray-400">Allergies: </span>{patient.allergies.join(", ")}</div>
          )}
          {patient.current_medications && (
            <div><span className="text-gray-400">Medications: </span>{patient.current_medications}</div>
          )}
          {!patient.blood_group &&
            !patient.medical_conditions &&
            !(patient.allergies && patient.allergies.length > 0) &&
            !patient.current_medications && (
              <div className="text-gray-400">No medical information recorded.</div>
            )}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="w-52 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Emergency Contact</span>
          <Pencil className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
        </div>
        <div className="text-gray-600">
          {patient.emergency_contact_name ? (
            <>
              <div>{patient.emergency_contact_name}</div>
              {patient.emergency_contact_phone && (
                <div className="text-gray-500">{patient.emergency_contact_phone}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400">Not recorded.</span>
          )}
        </div>
      </div>

      {/* Received to date — summed from this patient's real receipt rows.
          There is no invoices/billing table yet, so amount *due* cannot be
          derived; showing a total received instead of a fabricated due. */}
      <div className="w-52 border border-gray-200 rounded-lg p-3 text-xs">
        <div className="text-gray-500 mb-1">Received to Date</div>
        <div className="text-base font-semibold text-gray-700 mb-2">
          {receiptsTotal.toLocaleString("en-IN", {
            style: "currency", currency: "INR", minimumFractionDigits: 2,
          })}
        </div>
        <div className="text-gray-400">
          {receipts.length === 0
            ? "No receipts recorded."
            : `${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`}
        </div>
      </div>
    </div>
  );

  // ── Visits tab ──────────────────────────────────────────────────────────────
  //
  // Clinical notes, treatment plan and treatment-done tables were removed: they
  // were hardcoded sample rows, and no clinical_notes / treatment_plans /
  // treatments table exists to back them. Prescriptions and receipts are real
  // and render per-patient below.

  const visitsTab = (
    <div className="px-5 py-4 space-y-4">
      {/* Prescriptions */}
      <SectionHeader
        color="bg-blue-500"
        title="PRESCRIPTION"
        extra={
          <div className="ml-auto flex gap-2">
            <button className="rounded p-1 hover:bg-gray-100">
              <Share2 className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <button className="rounded p-1 hover:bg-gray-100">
              <Printer className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        }
      />
      {prescriptions.length === 0 ? (
        <div className="rounded border border-gray-100 px-3 py-6 text-center text-xs text-gray-400">
          No prescriptions recorded for this patient.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {["Date", "Drug", "Dosage", "Duration", "Total Qty", "Instruction"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDate(row.date)}</td>
                  <td className="px-3 py-2 max-w-[220px]">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-gray-400 text-[9px]">Rx</span>
                      </div>
                      <span className="leading-tight">{row.drug_name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{row.dosage ?? "—"}</td>
                  <td className="px-3 py-2">{row.duration ?? "—"}</td>
                  <td className="px-3 py-2">{row.quantity ?? ""}</td>
                  <td className="px-3 py-2 text-gray-600">{row.instructions ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipts */}
      <SectionHeader color="bg-green-500" title="RECEIPTS" />
      {receipts.length === 0 ? (
        <div className="rounded border border-gray-100 px-3 py-6 text-center text-xs text-gray-400">
          No receipts recorded for this patient.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {["Date", "Voucher #", "Mode", "Amount", "Notes"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDate(row.date)}</td>
                  <td className="px-3 py-2">{row.receipt_number ?? "—"}</td>
                  <td className="px-3 py-2">{row.mode ?? "—"}</td>
                  <td className="px-3 py-2">
                    {(row.amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2 text-right" colSpan={3}>Total</td>
                <td className="px-3 py-2">
                  {receiptsTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
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

      {noteModal && (
        <NoteModal
          patientId={patient.id}
          noteType={noteModal}
          createdBy={user?.id ?? null}
          onClose={() => setNoteModal(null)}
          onSaved={(n) => setNotes((prev) => [n, ...prev])}
        />
      )}
    </div>
  );
}
