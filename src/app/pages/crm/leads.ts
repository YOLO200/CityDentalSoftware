import { supabase } from "../../../lib/supabase";

/**
 * Enquiries (public.crm_leads) — written against the columns that actually
 * exist, probed live 2026-10-25:
 *   id, name, phone, email, source, source_type (024), status, treatment_interest,
 *   follow_up_date, assigned_to (sales owner → profiles.id), notes, branch_id,
 *   created_by, created_at, updated_at, converted_patient_id
 * The old LeadScreens wrote first_name / gender / priority / budget_range …
 * none of which exist, so every save failed.
 */

/** Values of the Postgres `lead_status` enum. "Follow-up Pending" is NOT one. */
export const LEAD_STATUS = ["New", "Contacted", "Interested", "Converted", "Lost"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

/** Still being worked — what the Prospect screen lists. */
export const OPEN_STATUSES: LeadStatus[] = ["New", "Contacted", "Interested"];

export const SOURCE_TYPES: Record<string, string[]> = {
  Online: ["Instagram", "Facebook", "Google Ads", "Website", "WhatsApp", "Practo", "JustDial"],
  Offline: ["Walk-in", "Dental Camp", "Hoarding / Banner", "Newspaper", "Phone Call"],
  Referral: ["Doctor Referral", "Existing Patient", "Friend / Family"],
  Other: ["Other"],
};

export const TREATMENT_INTERESTS = [
  "Consultation", "Dental Implant", "Root Canal", "Braces / Aligners", "Teeth Whitening",
  "Crown & Bridge", "Scaling & Cleaning", "Veneers", "Full Mouth Rehab", "Extraction",
  "Dentures", "Kids Dentistry", "Other",
];

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  source_type: string | null;
  status: LeadStatus;
  treatment_interest: string | null;
  follow_up_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  branch_id: string | null;
  created_at: string;
}

export type LeadInput = Omit<Lead, "id" | "created_at">;

/** Local-time YYYY-MM-DD; toISOString() would shift the date in IST. */
export function todayLocal(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Digits only, last 10 — so "+91 98765-43210" and "9876543210" match. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function describeCrmError(err: { code?: string; message?: string } | null): string {
  if (!err) return "Something went wrong.";
  if (err.code === "42501") {
    return "Not allowed: either migration 024 hasn't been run yet, or your role lacks the CRM permission for this centre.";
  }
  // Select (42703) and insert (PGRST204) both fail on the column 024 adds.
  if (err.message?.includes("source_type")) {
    return "Enquiries aren't fully set up yet — run supabase/migrations/024_crm_patient_tracker.sql.";
  }
  return err.message ?? "Something went wrong.";
}

const LEAD_COLUMNS =
  "id, name, phone, email, source, source_type, status, treatment_interest, follow_up_date, assigned_to, notes, branch_id, created_at";

export async function loadLeads(branchId: string, opts: { statuses?: LeadStatus[] } = {}) {
  let q = supabase.from("crm_leads").select(LEAD_COLUMNS).eq("branch_id", branchId);
  if (opts.statuses) q = q.in("status", opts.statuses);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function saveLead(input: LeadInput, id?: string, userId?: string | null) {
  const row = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = id
    ? await supabase.from("crm_leads").update(row).eq("id", id).select("id")
    : await supabase.from("crm_leads").insert({ ...row, created_by: userId ?? null }).select("id");
  if (error) throw error;
  // RLS reports a forbidden update as zero rows.
  if (!data || data.length === 0) throw { code: "42501" };
}

export async function updateLead(id: string, patch: Partial<LeadInput>) {
  const { data, error } = await supabase
    .from("crm_leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw { code: "42501" };
}

export async function deleteLead(id: string) {
  const { data, error } = await supabase.from("crm_leads").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw { code: "42501" };
}
