/**
 * Audit log helper.
 *
 * Usage:
 *   import { logAudit } from "@/lib/permissions/audit";
 *
 *   // View patient
 *   await logAudit("view_patient", "patients", patientId);
 *
 *   // Edit patient with before/after snapshot
 *   await logAudit("edit_patient", "patients", patient.id, oldData, newData);
 *
 *   // Change role
 *   await logAudit("change_role", "users_roles", userId, { role: oldRole }, { role: newRole });
 */

import { supabase } from "../supabase";

export async function logAudit(
  action:    string,
  module:    string,
  recordId?: string,
  oldData?:  Record<string, unknown>,
  newData?:  Record<string, unknown>,
) {
  const agent    = typeof navigator !== "undefined" ? navigator.userAgent : undefined;

  const { error } = await supabase.from("audit_logs").insert({
    action,
    module,
    record_id:  recordId  ?? null,
    old_data:   oldData   ?? null,
    new_data:   newData   ?? null,
    user_agent: agent     ?? null,
  });

  if (error && import.meta.env.DEV) {
    console.warn("[audit] Failed to write log:", error.message);
  }
}

// Convenience wrappers for common events
export const audit = {
  login:              ()                             => logAudit("login",              "auth"),
  logout:             ()                             => logAudit("logout",             "auth"),
  viewPatient:        (id: string)                   => logAudit("view_patient",        "patients",    id),
  createPatient:      (id: string, data: object)     => logAudit("create_patient",      "patients",    id, undefined, data as Record<string,unknown>),
  editPatient:        (id: string, o: object, n: object) => logAudit("edit_patient",   "patients",    id, o as Record<string,unknown>, n as Record<string,unknown>),
  archivePatient:     (id: string)                   => logAudit("archive_patient",    "patients",    id),
  createAppointment:  (id: string, data: object)     => logAudit("create_appointment", "appointments",id, undefined, data as Record<string,unknown>),
  cancelAppointment:  (id: string, reason: string)   => logAudit("cancel_appointment", "appointments",id, undefined, { reason }),
  viewBilling:        (id: string)                   => logAudit("view_billing",       "billing",     id),
  addPayment:         (id: string, data: object)     => logAudit("add_payment",        "billing",     id, undefined, data as Record<string,unknown>),
  exportReport:       (report: string)               => logAudit("export_report",      "reports",     undefined, undefined, { report }),
  changeRole:         (userId: string, old: string, next: string) => logAudit("change_role", "users_roles", userId, { role: old }, { role: next }),
  updatePermission:   (roleId: string, n: object)   => logAudit("update_permission",  "users_roles", roleId, undefined, n as Record<string,unknown>),
  deleteRecord:       (mod: string, id: string)      => logAudit("delete_record",      mod,           id),
};
