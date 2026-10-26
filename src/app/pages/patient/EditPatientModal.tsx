import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

/**
 * Every editable column on public.patients. Excluded on purpose:
 * id / patient_code (identity), branch_id (moved via the Centre select, which
 * is an access change), balance_due (a ledger figure, not profile data),
 * created_* / updated_at.
 */
export interface EditablePatient {
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  anniversary_date: string | null;
  first_visit_date: string | null;
  is_active: boolean;
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
  pregnancy_status: string | null;
  chief_complaint: string | null;
  previous_dentist: string | null;
  last_dental_visit: string | null;
  referring_doctor: string | null;
  treatment_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_provider: string | null;
  policy_number: string | null;
  coverage_percentage: number | null;
  payment_method: string | null;
  billing_notes: string | null;
  sms_reminders: boolean | null;
  email_reminders: boolean | null;
  whatsapp_notifications: boolean | null;
}

export type EditSection = "basic" | "contact" | "address" | "medical" | "emergency" | "insurance" | "preferences";

interface Props {
  patientId: string;
  patient: EditablePatient;
  initialSection?: EditSection;
  onClose: () => void;
  /** Called with the updated row (as returned by `select`) after a successful save. */
  onSaved: (row: Record<string, unknown>) => void;
}

// Enum values as they exist in Postgres (gender_type etc.), probed live —
// not the labels the old AddPatient form offered.
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v }));
const PREGNANCY = [
  { value: "not_applicable", label: "Not applicable" },
  { value: "not_pregnant", label: "Not pregnant" },
  { value: "pregnant", label: "Pregnant" },
];
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "Net banking" },
  { value: "insurance", label: "Insurance" },
];

type Form = Record<keyof EditablePatient, string | boolean>;

const BOOL_KEYS = ["is_active", "sms_reminders", "email_reminders", "whatsapp_notifications"] as const;

// Explicit, because the row passed in carries more than this (id, the
// branches embed, …) and anything iterated here is written back on save.
const KEYS: (keyof EditablePatient)[] = [
  "first_name", "last_name", "gender", "date_of_birth", "anniversary_date",
  "first_visit_date", "is_active", "phone", "alternate_phone", "email",
  "address", "city", "state", "zip_code", "blood_group", "allergies",
  "medical_conditions", "current_medications", "pregnancy_status",
  "chief_complaint", "previous_dentist", "last_dental_visit",
  "referring_doctor", "treatment_notes", "emergency_contact_name",
  "emergency_contact_phone", "insurance_provider", "policy_number",
  "coverage_percentage", "payment_method", "billing_notes", "sms_reminders",
  "email_reminders", "whatsapp_notifications",
];

function toForm(p: EditablePatient): Form {
  const f = {} as Form;
  for (const k of KEYS) {
    const v = p[k];
    if ((BOOL_KEYS as readonly string[]).includes(k)) f[k] = v !== false;
    else if (k === "allergies") f[k] = (p.allergies ?? []).join(", ");
    else f[k] = v === null || v === undefined ? "" : String(v);
  }
  return f;
}

/** Empty string → null, so clearing a field clears the column. */
function toRow(f: Form) {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) {
    if (typeof v === "boolean") row[k] = v;
    else if (k === "allergies") row[k] = v.split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "coverage_percentage") row[k] = v.trim() === "" ? null : Number(v);
    else row[k] = v.trim() === "" ? null : v.trim();
  }
  return row;
}

/** Keep a value the DB already holds selectable even if it's outside our list. */
function withCurrent(options: { value: string; label: string }[], current: string) {
  return current && !options.some((o) => o.value === current)
    ? [...options, { value: current, label: current }]
    : options;
}

export function EditPatientModal({ patientId, patient, initialSection, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Form>(() => toForm(patient));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<Partial<Record<EditSection, HTMLElement | null>>>({});

  useEffect(() => {
    if (initialSection) sectionRefs.current[initialSection]?.scrollIntoView({ block: "start" });
  }, [initialSection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (k: keyof EditablePatient) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: keyof EditablePatient) => form[k] as string;

  const handleSave = async () => {
    setError(null);
    const missing: string[] = [];
    if (!str("first_name").trim()) missing.push("First name");
    if (!str("last_name").trim()) missing.push("Surname");
    if (!str("phone").trim()) missing.push("Mobile number");
    if (missing.length) {
      setError(`Please fill in: ${missing.join(", ")}.`);
      sectionRefs.current[missing[0] === "Mobile number" ? "contact" : "basic"]?.scrollIntoView({ block: "start" });
      return;
    }
    const cov = str("coverage_percentage").trim();
    if (cov !== "" && !(Number(cov) >= 0 && Number(cov) <= 100)) {
      setError("Coverage must be a number between 0 and 100.");
      sectionRefs.current.insurance?.scrollIntoView({ block: "start" });
      return;
    }

    setSaving(true);
    const { data, error: err } = await supabase
      .from("patients")
      .update({ ...toRow(form), updated_at: new Date().toISOString() })
      .eq("id", patientId)
      .select("*, branches(name)")
      .maybeSingle();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    // RLS turns a forbidden update into zero rows rather than an error.
    if (!data) {
      setError("You don't have permission to edit this patient.");
      setSaving(false);
      return;
    }
    onSaved(data as Record<string, unknown>);
    onClose();
  };

  const section = (id: EditSection, title: string, children: React.ReactNode) => (
    <section ref={(el) => { sectionRefs.current[id] = el; }} className="scroll-mt-2 border-b border-gray-100 pb-5 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-[#1e2d5a]">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );

  const text = (k: keyof EditablePatient, label: string, opts: { type?: string; required?: boolean; wide?: boolean } = {}) => (
    <label className={`block ${opts.wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs text-gray-500">
        {label}
        {opts.required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={opts.type ?? "text"}
        value={str(k)}
        onChange={(e) => set(k)(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  );

  const area = (k: keyof EditablePatient, label: string) => (
    <label className="block sm:col-span-2">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <textarea
        value={str(k)}
        onChange={(e) => set(k)(e.target.value)}
        rows={2}
        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  );

  const select = (k: keyof EditablePatient, label: string, options: { value: string; label: string }[]) => (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <select
        value={str(k)}
        onChange={(e) => set(k)(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
      >
        <option value="">—</option>
        {withCurrent(options, str(k)).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );

  const toggle = (k: keyof EditablePatient, label: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={form[k] as boolean}
        onChange={(e) => set(k)(e.target.checked)}
        className="h-4 w-4 accent-[#1e2d5a]"
      />
      {label}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit patient"
      >
        <div className="relative flex items-center justify-center border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[#1e2d5a]">Edit Patient</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-6 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {section("basic", "Basic Information", <>
            {text("first_name", "First name", { required: true })}
            {text("last_name", "Surname", { required: true })}
            {select("gender", "Gender", GENDERS)}
            {text("date_of_birth", "Date of birth", { type: "date" })}
            {text("anniversary_date", "Anniversary", { type: "date" })}
            {text("first_visit_date", "Patient since", { type: "date" })}
            {toggle("is_active", "Active patient")}
          </>)}

          {section("contact", "Contact", <>
            {text("phone", "Mobile number", { type: "tel", required: true })}
            {text("alternate_phone", "Other mobile", { type: "tel" })}
            {text("email", "Email", { type: "email", wide: true })}
          </>)}

          {section("address", "Address", <>
            {text("address", "Address", { wide: true })}
            {text("city", "City")}
            {text("state", "State")}
            {text("zip_code", "PIN code")}
          </>)}

          {section("medical", "Medical Information", <>
            {select("blood_group", "Blood group", BLOOD_GROUPS)}
            {select("pregnancy_status", "Pregnancy status", PREGNANCY)}
            {text("allergies", "Allergies (comma-separated)", { wide: true })}
            {area("medical_conditions", "Medical history")}
            {area("current_medications", "Current medications")}
            {area("chief_complaint", "Chief complaint")}
            {text("previous_dentist", "Previous dentist")}
            {text("last_dental_visit", "Last dental visit", { type: "date" })}
            {text("referring_doctor", "Referring doctor", { wide: true })}
            {area("treatment_notes", "Treatment notes")}
          </>)}

          {section("emergency", "Emergency Contact", <>
            {text("emergency_contact_name", "Name")}
            {text("emergency_contact_phone", "Phone", { type: "tel" })}
          </>)}

          {section("insurance", "Insurance & Billing", <>
            {text("insurance_provider", "Insurance provider")}
            {text("policy_number", "Policy number")}
            {text("coverage_percentage", "Coverage %", { type: "number" })}
            {select("payment_method", "Preferred payment method", PAYMENT_METHODS)}
            {area("billing_notes", "Billing notes")}
          </>)}

          {section("preferences", "Communication", <>
            {toggle("sms_reminders", "SMS reminders")}
            {toggle("email_reminders", "Email reminders")}
            {toggle("whatsapp_notifications", "WhatsApp notifications")}
          </>)}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-7 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#1e2d5a] px-9 py-2.5 text-sm font-medium text-white hover:bg-[#162048] disabled:opacity-50"
            >
              {saving ? "SAVING…" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
