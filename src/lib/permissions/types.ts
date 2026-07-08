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

export interface RolePermission {
  role_id: string;
  permission_id: string;
  allowed: boolean;
}

export interface FieldPermission {
  role_id: string;
  resource: string;
  field_name: string;
  can_view: boolean;
  can_edit: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  module: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AssignedUser {
  id: string;
  name: string;
  email: string;
  role_name: string;
  clinic_name?: string;
  status: string;
  last_login?: string;
}
