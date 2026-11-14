export type Module =
  | "dashboard" | "calendar"  | "patients"      | "appointments"
  | "treatments"| "clinical_notes" | "prescriptions" | "billing"
  | "payments"  | "reports"   | "crm"           | "inventory"
  | "lab"       | "admin"     | "settings"      | "users_roles"
  | "audit_logs"| "documents" | "communication" | "memberships";

export type Action =
  | "view" | "create" | "edit" | "delete"
  | "export" | "print" | "approve" | "cancel" | "assign" | "manage";

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  active: boolean;
  created_at: string;
  user_count?: number;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}
