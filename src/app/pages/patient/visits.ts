import { supabase } from "../../../lib/supabase";

/**
 * Data layer for patient visits — supabase/migrations/023_visits.sql.
 *
 * Writes go through the save_visit RPC so a visit, its treatment lines and
 * its prescriptions commit together. Reads are three plain queries joined in
 * memory (no PostgREST embeds, matching calendar/data.ts).
 */

export type TreatmentKind = "plan" | "done" | "package";

export interface TreatmentLine {
  kind: TreatmentKind;
  treatment: string;
  teeth: string[];
  quantity: number;
  unit_cost: number;
  discount: number;
  notes: string;
}

export interface RxLine {
  drug_name: string;
  dosage: string;
  duration: string;
  quantity: string;
  instructions: string;
}

export interface ClinicalNote {
  complaints: string;
  observations: string;
  investigations: string;
  diagnosis: string;
  clinical_notes: string;
}

export interface Visit extends ClinicalNote {
  id: string;
  patient_id: string;
  branch_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  visit_date: string;
  instructions: string;
  created_at: string;
  treatments: TreatmentLine[];
  prescriptions: RxLine[];
}

export interface VisitDraft extends ClinicalNote {
  id?: string;
  patient_id: string;
  branch_id: string;
  doctor_id: string;
  appointment_id: string;
  visit_date: string;
  instructions: string;
  treatments: TreatmentLine[];
  prescriptions: RxLine[];
}

export interface PatientAppointment {
  id: string;
  appointment_date: string;
  start_time: string | null;
  treatment: string | null;
  doctor_id: string | null;
  status: string | null;
}

export const CLINICAL_FIELDS: { key: keyof ClinicalNote; label: string }[] = [
  { key: "complaints", label: "Complaints" },
  { key: "observations", label: "Observations" },
  { key: "investigations", label: "Investigations" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "clinical_notes", label: "Notes" },
];

/** Suggestions only — `treatment` is free text, there is no catalogue table yet. */
export const COMMON_TREATMENTS = [
  "Consultation", "Scaling & Polishing", "Root Canal Treatment", "Extraction",
  "Surgical Extraction", "Composite Filling", "GIC Filling", "Crown", "Bridge",
  "Implant", "Denture", "Veneer", "Teeth Whitening", "Braces", "Aligners",
  "Retainer", "Pulpectomy", "Fluoride Application", "Pit & Fissure Sealant",
  "Deep Curettage", "Flap Surgery", "IOPA X-Ray", "OPG",
];

/** FDI notation: permanent 11-48, primary 51-85. */
export function isValidTooth(t: string): boolean {
  return /^([1-4][1-8]|[5-8][1-5])$/.test(t);
}

export const lineAmount = (l: Pick<TreatmentLine, "quantity" | "unit_cost" | "discount">) =>
  Math.max((Number(l.quantity) || 0) * (Number(l.unit_cost) || 0) - (Number(l.discount) || 0), 0);

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** `limit` null = every visit ("Get Lifetime Data"). */
export async function loadVisits(patientId: string, limit: number | null): Promise<{ visits: Visit[]; hasMore: boolean }> {
  let q = supabase
    .from("visits")
    .select("*")
    .eq("patient_id", patientId)
    .order("visit_date", { ascending: false })
    .order("created_at", { ascending: false });
  // Fetch one extra to know whether there is more without a count query.
  if (limit !== null) q = q.limit(limit + 1);

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Record<string, unknown>[];
  const hasMore = limit !== null && rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const ids = page.map((r) => r.id as string);

  const [lines, rx] = ids.length
    ? await Promise.all([
        supabase.from("visit_treatments").select("*").in("visit_id", ids).order("sort_order"),
        supabase.from("prescriptions").select("*").in("visit_id", ids).order("created_at"),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (lines.error) throw lines.error;
  if (rx.error) throw rx.error;

  const visits = page.map<Visit>((r) => ({
    id: r.id as string,
    patient_id: r.patient_id as string,
    branch_id: r.branch_id as string,
    doctor_id: (r.doctor_id as string | null) ?? null,
    appointment_id: (r.appointment_id as string | null) ?? null,
    visit_date: r.visit_date as string,
    created_at: r.created_at as string,
    complaints: s(r.complaints),
    observations: s(r.observations),
    investigations: s(r.investigations),
    diagnosis: s(r.diagnosis),
    clinical_notes: s(r.clinical_notes),
    instructions: s(r.instructions),
    treatments: ((lines.data ?? []) as Record<string, unknown>[])
      .filter((l) => l.visit_id === r.id)
      .map((l) => ({
        kind: l.kind as TreatmentKind,
        treatment: s(l.treatment),
        teeth: (l.teeth as string[] | null) ?? [],
        quantity: Number(l.quantity) || 1,
        unit_cost: Number(l.unit_cost) || 0,
        discount: Number(l.discount) || 0,
        notes: s(l.notes),
      })),
    prescriptions: ((rx.data ?? []) as Record<string, unknown>[])
      .filter((p) => p.visit_id === r.id)
      .map((p) => ({
        drug_name: s(p.drug_name),
        dosage: s(p.dosage),
        duration: s(p.duration),
        quantity: s(p.quantity),
        instructions: s(p.instructions),
      })),
  }));

  return { visits, hasMore };
}

export async function saveVisit(draft: VisitDraft): Promise<string> {
  const { data, error } = await supabase.rpc("save_visit", { p: draft });
  if (error) throw error;
  return data as string;
}

/** Resolves to false when RLS silently refused the delete. */
export async function deleteVisit(id: string): Promise<boolean> {
  const { data, error } = await supabase.from("visits").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function loadPatientAppointments(patientId: string): Promise<PatientAppointment[]> {
  const { data } = await supabase
    .from("appointments")
    .select("id, appointment_date, start_time, treatment, doctor_id, status")
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false })
    .limit(50);
  return (data ?? []) as PatientAppointment[];
}

/** A Postgres/PostgREST error → a sentence for the form. */
export function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e?.code === "PGRST205" || e?.code === "PGRST202" || e?.code === "42P01") {
    return "Visits aren't set up yet — run supabase/migrations/023_visits.sql.";
  }
  if (e?.code === "42501") return "You don't have permission to do that for this patient or centre.";
  return e?.message ?? "Something went wrong.";
}
