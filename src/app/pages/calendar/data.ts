import { supabase } from "../../../lib/supabase";
import type {
  Appointment, AppointmentStatus, Patient, Task, DoctorUnavailability,
} from "./types";

/**
 * Supabase-backed data layer for the Calendar.
 *
 * Two conventions worth keeping:
 *
 * 1. No PostgREST embeds. `appointments.doctor_id` holds an auth.uid() and may
 *    have no declared FK to `profiles`; embedding would 400 the whole request.
 *    Related rows are fetched by id in a second pass and joined in memory.
 * 2. After any write, the caller reloads. The DB assigns uuids, applies
 *    defaults and enforces the status enum, so re-reading is the only way to
 *    hold true state — never optimistically splice a locally-built row.
 */

// Assigned by position in the sorted doctor list so a given doctor keeps the
// same colour across views and reloads.
const DOCTOR_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EF4444", "#14B8A6", "#EC4899", "#6366F1",
];

export interface Doctor {
  id: string;
  name: string;
  color: string;
  label: string;
}

export const colorForIndex = (i: number) => DOCTOR_COLORS[i % DOCTOR_COLORS.length];

const KNOWN_STATUSES: AppointmentStatus[] = [
  "Scheduled", "Confirmed", "Pending", "Arrived", "In Waiting",
  "In Treatment", "Completed", "Cancelled", "No-show", "Rescheduled",
];

/**
 * `row.status as AppointmentStatus` is a cast TypeScript cannot verify, and a
 * value the client does not know about used to crash the calendar while
 * rendering. Validate instead of asserting: if Postgres gains an enum value
 * before the client does, degrade to "Scheduled" rather than blank the page.
 */
function toStatus(raw: unknown): AppointmentStatus {
  return KNOWN_STATUSES.includes(raw as AppointmentStatus)
    ? (raw as AppointmentStatus)
    : "Scheduled";
}

// ── Reference data ──────────────────────────────────────────────────────────

export async function loadDoctors(): Promise<Doctor[]> {
  // `role` is free text on profiles, so match loosely rather than assuming a
  // fixed vocabulary; fall back to every profile if nothing matches.
  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, specialization")
    .order("name");

  const rows = data ?? [];
  const docs = rows.filter(r => (r.role ?? "").toLowerCase().includes("doctor"));
  const chosen = docs.length > 0 ? docs : rows;

  return chosen.map((r: any, i: number) => ({
    id: r.id,
    name: r.name ?? "Unnamed",
    color: colorForIndex(i),
    label: r.specialization ? `${r.name} — ${r.specialization}` : (r.name ?? "Unnamed"),
  }));
}

export async function loadPatients(branchId: string): Promise<Patient[]> {
  const { data } = await supabase
    .from("patients")
    .select("id, first_name, last_name, phone, email")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("first_name");

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    phone: p.phone ?? "",
    email: p.email ?? undefined,
  }));
}

// ── Appointments ────────────────────────────────────────────────────────────

export async function loadAppointments(
  branchId: string,
  from: string,
  to: string,
  doctors: Doctor[],
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, doctor_id, treatment, treatment_category, appointment_date," +
      " start_time, end_time, status, notes, appointment_type, operatory," +
      " is_new_patient, has_pending_payment, cancel_reason, reschedule_reason," +
      " group_id, group_title, series_id, branch_id",
    )
    .eq("branch_id", branchId)
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date")
    .order("start_time");

  if (error) throw error;
  const rows = data ?? [];

  // Second pass for patient names/phones.
  const patientIds = [...new Set(rows.map((r: any) => r.patient_id).filter(Boolean))];
  const { data: pats } = patientIds.length
    ? await supabase.from("patients").select("id, first_name, last_name, phone").in("id", patientIds)
    : { data: [] as any[] };

  const patientById = new Map(
    (pats ?? []).map((p: any) => [p.id, { name: `${p.first_name} ${p.last_name}`.trim(), phone: p.phone ?? "" }]),
  );
  const doctorById = new Map(doctors.map(d => [d.id, d]));

  return rows.map((r: any) => {
    const doc = doctorById.get(r.doctor_id);
    const pat = patientById.get(r.patient_id);
    return {
      id: r.id,
      appointmentType: r.appointment_type ?? "Regular",
      patientName: pat?.name ?? "Unknown patient",
      patientId: r.patient_id ?? "",
      patientPhone: pat?.phone ?? "",
      isNewPatient: !!r.is_new_patient,
      doctor: doc?.name ?? "Unassigned",
      doctorId: r.doctor_id ?? "",
      doctorColor: doc?.color ?? "#94A3B8",
      treatment: r.treatment ?? "",
      treatmentCategory: r.treatment_category ?? "Not Specified",
      center: r.branch_id ?? "",
      operatory: r.operatory ?? undefined,
      date: r.appointment_date,
      startTime: (r.start_time ?? "").slice(0, 5),
      endTime: (r.end_time ?? "").slice(0, 5),
      status: toStatus(r.status),
      notes: r.notes ?? "",
      hasPendingPayment: !!r.has_pending_payment,
      cancelReason: r.cancel_reason ?? undefined,
      rescheduleReason: r.reschedule_reason ?? undefined,
      groupId: r.group_id ?? undefined,
      groupTitle: r.group_title ?? undefined,
      seriesId: r.series_id ?? undefined,
    } as Appointment;
  });
}

/** Domain object -> insert payload. Client-generated ids are dropped; the DB assigns them. */
function appointmentToRow(a: Appointment, branchId: string) {
  return {
    branch_id: branchId,
    patient_id: a.patientId || null,
    doctor_id: a.doctorId || null,
    treatment: a.treatment || "Consultation",
    treatment_category: a.treatmentCategory || null,
    appointment_date: a.date,
    start_time: a.startTime,
    end_time: a.endTime,
    status: a.status,
    notes: a.notes || null,
    appointment_type: a.appointmentType || "Regular",
    operatory: a.operatory || null,
    is_new_patient: !!a.isNewPatient,
    has_pending_payment: !!a.hasPendingPayment,
    cancel_reason: a.cancelReason || null,
    reschedule_reason: a.rescheduleReason || null,
    group_title: a.groupTitle || null,
  };
}

/**
 * Series and group bookings arrive as sibling rows sharing a client-side id.
 * Those ids are remapped to real uuids so the grouping survives the insert.
 */
export async function insertAppointments(apts: Appointment[], branchId: string) {
  const groupMap = new Map<string, string>();
  const seriesMap = new Map<string, string>();
  const newId = () => crypto.randomUUID();

  const rows = apts.map(a => {
    const row: any = appointmentToRow(a, branchId);
    if (a.groupId) {
      if (!groupMap.has(a.groupId)) groupMap.set(a.groupId, newId());
      row.group_id = groupMap.get(a.groupId);
    }
    if (a.seriesId) {
      if (!seriesMap.has(a.seriesId)) seriesMap.set(a.seriesId, newId());
      row.series_id = seriesMap.get(a.seriesId);
    }
    return row;
  });

  const { error } = await supabase.from("appointments").insert(rows);
  if (error) throw error;
}

export async function updateAppointment(a: Appointment) {
  const { error } = await supabase
    .from("appointments")
    .update({
      status: a.status,
      notes: a.notes || null,
      treatment: a.treatment,
      treatment_category: a.treatmentCategory || null,
      appointment_date: a.date,
      start_time: a.startTime,
      end_time: a.endTime,
      doctor_id: a.doctorId || null,
      operatory: a.operatory || null,
      has_pending_payment: !!a.hasPendingPayment,
      cancel_reason: a.cancelReason || null,
      reschedule_reason: a.rescheduleReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", a.id);
  if (error) throw error;
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export async function loadTasks(
  branchId: string,
  from: string,
  to: string,
  doctors: Doctor[],
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("calendar_tasks")
    .select("*")
    .eq("branch_id", branchId)
    .or(`date.is.null,and(date.gte.${from},date.lte.${to})`)
    .order("date");

  if (error) throw error;
  const nameById = new Map(doctors.map(d => [d.id, d.name]));

  return (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    center: t.branch_id ?? "",
    project: t.project ?? undefined,
    assignedTo: t.assigned_to ? (nameById.get(t.assigned_to) ?? undefined) : undefined,
    patientId: t.patient_id ?? undefined,
    date: t.date ?? undefined,
    startTime: t.start_time ? t.start_time.slice(0, 5) : undefined,
    endTime: t.end_time ? t.end_time.slice(0, 5) : undefined,
    allDay: !!t.all_day,
    disallowAppointments: !!t.disallow_appointments,
    dueDate: t.due_date ?? undefined,
    dueTime: t.due_time ? t.due_time.slice(0, 5) : undefined,
    status: t.status,
    notes: t.notes ?? undefined,
    isRecurring: !!t.is_recurring,
    repeatFrequency: t.repeat_frequency ?? undefined,
    repeatUntil: t.repeat_until ?? undefined,
    showOnCalendar: t.show_on_calendar !== false,
    color: t.color ?? "#6366F1",
  }));
}

export async function insertTasks(tasks: Task[], branchId: string, doctors: Doctor[], userId?: string) {
  const idByName = new Map(doctors.map(d => [d.name, d.id]));

  const rows = tasks.map(t => ({
    branch_id: branchId,
    name: t.name,
    project: t.project || null,
    // assignedTo is a display name in the modal; resolve back to an id where
    // possible. Non-doctor staff (nurses, admin) have no profile row, so this
    // is null for them rather than failing the insert.
    assigned_to: t.assignedTo ? (idByName.get(t.assignedTo) ?? null) : null,
    patient_id: t.patientId || null,
    date: t.date || null,
    start_time: t.startTime || null,
    end_time: t.endTime || null,
    all_day: !!t.allDay,
    disallow_appointments: !!t.disallowAppointments,
    due_date: t.dueDate || null,
    due_time: t.dueTime || null,
    status: t.status || "New",
    notes: t.notes || null,
    is_recurring: !!t.isRecurring,
    repeat_frequency: t.repeatFrequency || null,
    repeat_until: t.repeatUntil || null,
    show_on_calendar: t.showOnCalendar !== false,
    color: t.color || "#6366F1",
    created_by: userId ?? null,
  }));

  const { error } = await supabase.from("calendar_tasks").insert(rows);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("calendar_tasks").delete().eq("id", id);
  if (error) throw error;
}

// ── Doctor unavailability ───────────────────────────────────────────────────

export async function loadUnavailability(
  branchId: string,
  from: string,
  to: string,
  doctors: Doctor[],
): Promise<DoctorUnavailability[]> {
  const { data, error } = await supabase
    .from("doctor_unavailability")
    .select("*")
    .eq("branch_id", branchId)
    .lte("from_date", to)
    .gte("to_date", from)
    .order("from_date");

  if (error) throw error;
  const nameById = new Map(doctors.map(d => [d.id, d.name]));

  return (data ?? []).map((u: any) => ({
    id: u.id,
    // One row per doctor (see migration 012), so this is always a single name.
    doctors: [nameById.get(u.doctor_id) ?? "Unknown"],
    fromDate: u.from_date,
    fromTime: (u.from_time ?? "").slice(0, 5),
    toDate: u.to_date,
    toTime: (u.to_time ?? "").slice(0, 5),
    reason: u.reason,
    description: u.description ?? undefined,
  }));
}

export async function insertUnavailability(
  blocks: DoctorUnavailability[],
  branchId: string,
  doctors: Doctor[],
  userId?: string,
) {
  const idByName = new Map(doctors.map(d => [d.name, d.id]));

  // A block naming several doctors fans out into one row each.
  const rows = blocks.flatMap(b =>
    b.doctors
      .map(name => idByName.get(name))
      .filter((id): id is string => !!id)
      .map(doctorId => ({
        branch_id: branchId,
        doctor_id: doctorId,
        from_date: b.fromDate,
        from_time: b.fromTime,
        to_date: b.toDate,
        to_time: b.toTime,
        reason: b.reason,
        description: b.description || null,
        created_by: userId ?? null,
      })),
  );

  if (rows.length === 0) {
    throw new Error("None of the selected doctors have a profile record.");
  }

  const { error } = await supabase.from("doctor_unavailability").insert(rows);
  if (error) throw error;
}

export async function deleteUnavailability(id: string) {
  const { error } = await supabase.from("doctor_unavailability").delete().eq("id", id);
  if (error) throw error;
}
