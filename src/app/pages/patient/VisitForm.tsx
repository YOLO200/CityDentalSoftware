import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import type { Doctor } from "../calendar/data";
import {
  CLINICAL_FIELDS,
  COMMON_TREATMENTS,
  describeError,
  isValidTooth,
  lineAmount,
  loadPatientAppointments,
  saveVisit,
  type ClinicalNote,
  type PatientAppointment,
  type TreatmentKind,
  type Visit,
} from "./visits";

// ─── Form-local shapes: numbers and teeth stay strings while being typed ────

interface FormLine {
  key: string;
  treatment: string;
  teethText: string;
  quantity: string;
  unit_cost: string;
  discount: string;
  notes: string;
}

interface FormRx {
  key: string;
  drug_name: string;
  dosage: string;
  duration: string;
  quantity: string;
  instructions: string;
}

type SectionId = "clinical" | TreatmentKind | "rx" | "instructions";

const SECTIONS: { id: SectionId; title: string }[] = [
  { id: "clinical", title: "Clinical Note" },
  { id: "plan", title: "Treatment Plan" },
  { id: "done", title: "Treatment Done" },
  { id: "package", title: "Package" },
  { id: "rx", title: "Prescriptions" },
  { id: "instructions", title: "Instructions" },
];

const DOSAGES = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "0-1-0", "SOS"];
const RX_INSTRUCTIONS = ["After food", "Before food", "With warm water", "Apply locally"];
const QUICK_INSTRUCTIONS = [
  "Do not eat or drink for 1 hour.",
  "Avoid hot food and drinks for 24 hours.",
  "Do not rinse or spit forcefully for 24 hours.",
  "Apply an ice pack on the cheek for 15 minutes at a time.",
  "Take medicines as prescribed.",
  "Brush twice daily and floss once a day.",
];

const newKey = () => crypto.randomUUID();
const emptyLine = (): FormLine => ({ key: newKey(), treatment: "", teethText: "", quantity: "1", unit_cost: "", discount: "", notes: "" });
const emptyRx = (): FormRx => ({ key: newKey(), drug_name: "", dosage: "", duration: "", quantity: "", instructions: "" });

/** Local-time YYYY-MM-DD; toISOString() would shift the date in IST. */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const lineIsBlank = (l: FormLine) => !l.treatment.trim() && !l.teethText.trim() && !l.unit_cost.trim() && !l.notes.trim();
const rxIsBlank = (r: FormRx) => !r.drug_name.trim() && !r.dosage.trim() && !r.duration.trim() && !r.quantity.trim() && !r.instructions.trim();

// ─── Small presentational pieces ─────────────────────────────────────────────

/** Outlined field with the label sitting on the border, as in the reference UI. */
function Outlined({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative rounded-lg border border-gray-300 px-3 pb-2 pt-3 focus-within:border-indigo-400">
      <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-gray-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </div>
  );
}

const cellInput = "w-full rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400";

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  /** Pre-selected centre for a new visit — the patient's own branch. */
  defaultBranchId: string | null;
  doctors: Doctor[];
  existing?: Visit;
  onCancel: () => void;
  onSaved: () => void;
  /** Opens the patient editor at Medical Information. */
  onUpdateMedical: () => void;
}

export function VisitForm({ patientId, defaultBranchId, doctors, existing, onCancel, onSaved, onUpdateMedical }: Props) {
  const { user } = useAuth();
  const { branches, selectedBranch } = useBranch();

  const initialDoctor =
    existing?.doctor_id ?? (doctors.some((d) => d.id === user?.id) ? user!.id : "");

  const [branchId, setBranchId] = useState(
    existing?.branch_id ??
      (branches.some((b) => b.id === defaultBranchId) ? defaultBranchId! : selectedBranch?.id ?? ""),
  );
  const [visitDate, setVisitDate] = useState(existing?.visit_date ?? todayLocal());
  const [doctorId, setDoctorId] = useState(initialDoctor);
  // Locked to the signed-in doctor by default; "Change Doctor" unlocks it. With
  // no sensible default there is nothing to protect, so start unlocked.
  const [doctorUnlocked, setDoctorUnlocked] = useState(initialDoctor === "");
  const [appointmentId, setAppointmentId] = useState(existing?.appointment_id ?? "");
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);

  const [clinical, setClinical] = useState<ClinicalNote>({
    complaints: existing?.complaints ?? "",
    observations: existing?.observations ?? "",
    investigations: existing?.investigations ?? "",
    diagnosis: existing?.diagnosis ?? "",
    clinical_notes: existing?.clinical_notes ?? "",
  });
  const [lines, setLines] = useState<Record<TreatmentKind, FormLine[]>>(() => {
    const by = (k: TreatmentKind) =>
      (existing?.treatments ?? [])
        .filter((t) => t.kind === k)
        .map((t) => ({
          key: newKey(),
          treatment: t.treatment,
          teethText: t.teeth.join(", "),
          quantity: String(t.quantity),
          unit_cost: t.unit_cost ? String(t.unit_cost) : "",
          discount: t.discount ? String(t.discount) : "",
          notes: t.notes,
        }));
    return { plan: by("plan"), done: by("done"), package: by("package") };
  });
  const [rx, setRx] = useState<FormRx[]>(() =>
    (existing?.prescriptions ?? []).map((p) => ({ key: newKey(), ...p })),
  );
  const [instructions, setInstructions] = useState(existing?.instructions ?? "");

  // When editing, open whatever already has content; a new visit starts with
  // just the clinical note open.
  const [open, setOpen] = useState<Set<SectionId>>(() => {
    if (!existing) return new Set<SectionId>(["clinical"]);
    const s = new Set<SectionId>();
    if (CLINICAL_FIELDS.some((f) => existing[f.key])) s.add("clinical");
    for (const k of ["plan", "done", "package"] as TreatmentKind[]) if (existing.treatments.some((t) => t.kind === k)) s.add(k);
    if (existing.prescriptions.length) s.add("rx");
    if (existing.instructions) s.add("instructions");
    return s;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatientAppointments(patientId).then(setAppointments);
  }, [patientId]);

  const doctorName = useMemo(() => new Map(doctors.map((d) => [d.id, d.name])), [doctors]);

  const toggle = (id: SectionId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ensureOpen = (id: SectionId) => setOpen((prev) => new Set(prev).add(id));

  const pickAppointment = (id: string) => {
    setAppointmentId(id);
    const a = appointments.find((x) => x.id === id);
    if (!a) return;
    // An appointment fixes when and with whom — carry both across.
    setVisitDate(a.appointment_date);
    if (a.doctor_id) setDoctorId(a.doctor_id);
  };

  // ── Line editing ──────────────────────────────────────────────────────────

  const updateLine = (kind: TreatmentKind, key: string, patch: Partial<FormLine>) =>
    setLines((prev) => ({ ...prev, [kind]: prev[kind].map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const addLine = (kind: TreatmentKind) => {
    setLines((prev) => ({ ...prev, [kind]: [...prev[kind], emptyLine()] }));
    ensureOpen(kind);
  };
  const removeLine = (kind: TreatmentKind, key: string) =>
    setLines((prev) => ({ ...prev, [kind]: prev[kind].filter((l) => l.key !== key) }));
  const copyPlanToDone = () => {
    setLines((prev) => ({
      ...prev,
      done: [...prev.done.filter((l) => !lineIsBlank(l)), ...prev.plan.filter((l) => !lineIsBlank(l)).map((l) => ({ ...l, key: newKey() }))],
    }));
    ensureOpen("done");
  };

  const updateRx = (key: string, patch: Partial<FormRx>) =>
    setRx((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setError(null);
    const problems: string[] = [];
    if (!branchId) problems.push("Select a centre.");
    if (!visitDate) problems.push("Select a visit date.");
    if (!doctorId) problems.push("Select a doctor.");

    const treatments = (["plan", "done", "package"] as TreatmentKind[]).flatMap((kind) =>
      lines[kind].filter((l) => !lineIsBlank(l)).map((l) => {
        const title = SECTIONS.find((s) => s.id === kind)!.title;
        const teeth = l.teethText.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
        const bad = teeth.filter((t) => !isValidTooth(t));
        const quantity = Number(l.quantity || "1");
        const unit_cost = Number(l.unit_cost || "0");
        const discount = Number(l.discount || "0");
        if (!l.treatment.trim()) problems.push(`${title}: every row needs a treatment name.`);
        if (bad.length) problems.push(`${title}: "${bad.join(", ")}" ${bad.length > 1 ? "are not valid tooth numbers" : "is not a valid tooth number"} (use FDI, e.g. 11–48, 51–85).`);
        if (!(quantity > 0)) problems.push(`${title}: quantity must be more than 0.`);
        if (!(unit_cost >= 0) || !(discount >= 0)) problems.push(`${title}: cost and discount can't be negative.`);
        else if (discount > quantity * unit_cost) problems.push(`${title}: discount on "${l.treatment || "a row"}" is more than its cost.`);
        return { kind, treatment: l.treatment.trim(), teeth, quantity, unit_cost, discount, notes: l.notes.trim() };
      }),
    );

    const prescriptions = rx.filter((r) => !rxIsBlank(r)).map((r) => {
      if (!r.drug_name.trim()) problems.push("Prescriptions: every row needs a drug name.");
      const { key: _key, ...rest } = r;
      return rest;
    });

    if (problems.length) {
      setError([...new Set(problems)].join(" "));
      return;
    }

    setSaving(true);
    try {
      await saveVisit({
        id: existing?.id,
        patient_id: patientId,
        branch_id: branchId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        visit_date: visitDate,
        ...clinical,
        instructions,
        treatments,
        prescriptions,
      });
      onSaved();
    } catch (err) {
      setError(describeError(err));
      setSaving(false);
    }
  };

  // ── Section bodies ────────────────────────────────────────────────────────

  const sectionCount = (id: SectionId): number => {
    if (id === "clinical") return CLINICAL_FIELDS.filter((f) => clinical[f.key].trim()).length;
    if (id === "rx") return rx.filter((r) => !rxIsBlank(r)).length;
    if (id === "instructions") return instructions.trim() ? 1 : 0;
    return lines[id].filter((l) => !lineIsBlank(l)).length;
  };

  const renderLines = (kind: TreatmentKind) => {
    const rows = lines[kind];
    const isPackage = kind === "package";
    const total = rows.reduce((sum, l) => sum + lineAmount({ quantity: Number(l.quantity || 1), unit_cost: Number(l.unit_cost || 0), discount: Number(l.discount || 0) }), 0);
    return (
      <div className="space-y-2">
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="px-1 pb-1 font-medium">{isPackage ? "Package" : "Treatment"}</th>
                  {!isPackage && <th className="w-28 px-1 pb-1 font-medium">Teeth</th>}
                  <th className="w-16 px-1 pb-1 font-medium">{isPackage ? "Sessions" : "Qty"}</th>
                  <th className="w-24 px-1 pb-1 font-medium">Unit cost</th>
                  <th className="w-24 px-1 pb-1 font-medium">Discount</th>
                  <th className="w-24 px-1 pb-1 text-right font-medium">Amount</th>
                  <th className="px-1 pb-1 font-medium">Notes</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.key}>
                    <td className="px-1 py-1">
                      <input list="visit-treatments" value={l.treatment} onChange={(e) => updateLine(kind, l.key, { treatment: e.target.value })} className={cellInput} aria-label="Treatment" />
                    </td>
                    {!isPackage && (
                      <td className="px-1 py-1">
                        <input value={l.teethText} onChange={(e) => updateLine(kind, l.key, { teethText: e.target.value })} placeholder="e.g. 36, 37" className={cellInput} aria-label="Teeth" />
                      </td>
                    )}
                    <td className="px-1 py-1">
                      <input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(kind, l.key, { quantity: e.target.value })} className={cellInput} aria-label="Quantity" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" min={0} value={l.unit_cost} onChange={(e) => updateLine(kind, l.key, { unit_cost: e.target.value })} placeholder="0" className={cellInput} aria-label="Unit cost" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" min={0} value={l.discount} onChange={(e) => updateLine(kind, l.key, { discount: e.target.value })} placeholder="0" className={cellInput} aria-label="Discount" />
                    </td>
                    <td className="px-1 py-1 text-right text-gray-700">
                      {inr(lineAmount({ quantity: Number(l.quantity || 1), unit_cost: Number(l.unit_cost || 0), discount: Number(l.discount || 0) }))}
                    </td>
                    <td className="px-1 py-1">
                      <input value={l.notes} onChange={(e) => updateLine(kind, l.key, { notes: e.target.value })} className={cellInput} aria-label="Notes" />
                    </td>
                    <td className="px-1 py-1">
                      <button onClick={() => removeLine(kind, l.key)} aria-label="Remove row" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={isPackage ? 4 : 5} className="px-1 pt-2 text-right font-semibold text-gray-600">Total</td>
                  <td className="px-1 pt-2 text-right font-semibold text-gray-800">{inr(total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => addLine(kind)} className="flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">
            <Plus className="h-3 w-3" /> Add {isPackage ? "package" : "treatment"}
          </button>
          {kind === "done" && lines.plan.some((l) => !lineIsBlank(l)) && (
            <button onClick={copyPlanToDone} className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">
              Copy from treatment plan
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderRx = () => (
    <div className="space-y-2">
      {rx.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-1 pb-1 font-medium">Drug</th>
                <th className="w-24 px-1 pb-1 font-medium">Dosage</th>
                <th className="w-24 px-1 pb-1 font-medium">Duration</th>
                <th className="w-16 px-1 pb-1 font-medium">Qty</th>
                <th className="px-1 pb-1 font-medium">Instructions</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rx.map((r) => (
                <tr key={r.key}>
                  <td className="px-1 py-1"><input value={r.drug_name} onChange={(e) => updateRx(r.key, { drug_name: e.target.value })} placeholder="e.g. Amoxicillin 500mg" className={cellInput} aria-label="Drug" /></td>
                  <td className="px-1 py-1"><input list="visit-dosages" value={r.dosage} onChange={(e) => updateRx(r.key, { dosage: e.target.value })} placeholder="1-0-1" className={cellInput} aria-label="Dosage" /></td>
                  <td className="px-1 py-1"><input value={r.duration} onChange={(e) => updateRx(r.key, { duration: e.target.value })} placeholder="5 days" className={cellInput} aria-label="Duration" /></td>
                  <td className="px-1 py-1"><input value={r.quantity} onChange={(e) => updateRx(r.key, { quantity: e.target.value })} className={cellInput} aria-label="Quantity" /></td>
                  <td className="px-1 py-1"><input list="visit-rx-instructions" value={r.instructions} onChange={(e) => updateRx(r.key, { instructions: e.target.value })} className={cellInput} aria-label="Instructions" /></td>
                  <td className="px-1 py-1">
                    <button onClick={() => setRx((prev) => prev.filter((x) => x.key !== r.key))} aria-label="Remove row" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={() => { setRx((prev) => [...prev, emptyRx()]); ensureOpen("rx"); }} className="flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">
        <Plus className="h-3 w-3" /> Add drug
      </button>
    </div>
  );

  const renderSection = (id: SectionId) => {
    if (id === "clinical") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CLINICAL_FIELDS.map((f) => (
            <label key={f.key} className={f.key === "clinical_notes" ? "md:col-span-2" : ""}>
              <span className="mb-1 block text-xs text-gray-500">{f.label}</span>
              <textarea
                value={clinical[f.key]}
                onChange={(e) => setClinical((c) => ({ ...c, [f.key]: e.target.value }))}
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>
          ))}
        </div>
      );
    }
    if (id === "rx") return renderRx();
    if (id === "instructions") {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INSTRUCTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setInstructions((t) => (t.trim() ? `${t.trimEnd()}\n${q}` : q))}
                className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
              >
                + {q}
              </button>
            ))}
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="Instructions for the patient"
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      );
    }
    return renderLines(id);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const doctorOptions = doctorId && !doctorName.has(doctorId)
    ? [...doctors, { id: doctorId, name: "Unknown doctor", label: "Unknown doctor", color: "" }]
    : doctors;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <datalist id="visit-treatments">{COMMON_TREATMENTS.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="visit-dosages">{DOSAGES.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="visit-rx-instructions">{RX_INSTRUCTIONS.map((t) => <option key={t} value={t} />)}</datalist>

      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        <Outlined label="Center" required>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="Center">
            <option value="">Select center</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Outlined>
        <Outlined label="Visit Date" required>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="Visit date" />
        </Outlined>
        <Outlined label="Doctor" required>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={!doctorUnlocked}
            className="w-full bg-transparent text-sm outline-none disabled:text-gray-700"
            aria-label="Doctor"
          >
            <option value="">Select doctor</option>
            {doctorOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Outlined>
        <Outlined label="Appointment">
          <select value={appointmentId} onChange={(e) => pickAppointment(e.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="Appointment">
            <option value="">{appointments.length ? "Select Appointment" : "No appointments"}</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {new Date(a.appointment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {a.start_time ? `, ${a.start_time.slice(0, 5)}` : ""}
                {a.treatment ? ` · ${a.treatment}` : ""}
                {a.status ? ` (${a.status})` : ""}
              </option>
            ))}
          </select>
        </Outlined>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button onClick={onUpdateMedical} className="text-sm text-[#1e2d5a] hover:underline">
          Update Medical History, Habits, Allergies
        </button>
        <button
          onClick={() => setDoctorUnlocked(true)}
          disabled={doctorUnlocked}
          className="rounded bg-[#1e2d5a] px-3 py-1.5 text-sm text-white hover:bg-[#162048] disabled:opacity-40"
        >
          Change Doctor
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {SECTIONS.map((s) => {
          const isOpen = open.has(s.id);
          const count = sectionCount(s.id);
          return (
            <div key={s.id} className="bg-gray-100">
              <button
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-200/60"
              >
                <span>
                  {s.title}
                  {count > 0 && <span className="ml-2 rounded-full bg-[#1e2d5a] px-1.5 py-0.5 text-[10px] text-white">{count}</span>}
                </span>
                {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              {isOpen && <div className="border-x border-b border-gray-100 bg-white p-4">{renderSection(s.id)}</div>}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      <div className="mt-4 flex justify-center gap-4">
        <button onClick={onCancel} disabled={saving} className="rounded-lg border border-gray-300 px-8 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
          CANCEL
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#1e2d5a] px-9 py-2.5 text-sm font-medium text-white hover:bg-[#162048] disabled:opacity-50">
          {saving ? "SAVING…" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
