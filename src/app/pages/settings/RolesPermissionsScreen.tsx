import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Shield, Lock, Copy, Trash2, Edit3, Plus, Save, RotateCcw,
  Search, Users, ChevronDown, AlertTriangle, CheckSquare,
  X, Eye, EyeOff, Clock, Globe, Building2, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { audit } from "../../../lib/permissions/audit";

// ── Types ──────────────────────────────────────────────────────

interface RoleLocal {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  active: boolean;
  user_count: number;
  scope: "all" | "selected" | "own";
  data_scope: "all_patients" | "own_patients" | "own_appointments" | "own_records" | "clinic_patients";
}

type TabKey = "permissions" | "fields" | "users" | "details";

interface AssignedUserRow {
  id: string;        // user_roles.id
  name: string;
  clinic: string;
  role_in_profile: string;
}

// ── Constants ──────────────────────────────────────────────────

const MODULES = [
  { key: "dashboard",      label: "Dashboard",       group: "Core"        },
  { key: "calendar",       label: "Calendar",         group: "Core"        },
  { key: "patients",       label: "Patients",         group: "Clinical"    },
  { key: "appointments",   label: "Appointments",     group: "Clinical"    },
  { key: "treatments",     label: "Treatments",       group: "Clinical"    },
  { key: "clinical_notes", label: "Clinical Notes",   group: "Clinical"    },
  { key: "prescriptions",  label: "Prescriptions",    group: "Clinical"    },
  { key: "billing",        label: "Billing",          group: "Finance"     },
  { key: "payments",       label: "Payments",         group: "Finance"     },
  { key: "reports",        label: "Reports",          group: "Finance"     },
  { key: "crm",            label: "CRM",              group: "Operations"  },
  { key: "inventory",      label: "Inventory",        group: "Operations"  },
  { key: "lab",            label: "Lab",              group: "Operations"  },
  { key: "communication",  label: "Communication",    group: "Operations"  },
  { key: "memberships",    label: "Memberships",      group: "Operations"  },
  { key: "admin",          label: "Admin",            group: "System"      },
  { key: "settings",       label: "Settings",         group: "System"      },
  { key: "users_roles",    label: "Users & Roles",    group: "System"      },
  { key: "audit_logs",     label: "Audit Logs",       group: "System"      },
  { key: "documents",      label: "Documents",        group: "System"      },
];

const ACTIONS = [
  { key: "view",    label: "View"    },
  { key: "create",  label: "Create"  },
  { key: "edit",    label: "Edit"    },
  { key: "delete",  label: "Delete"  },
  { key: "export",  label: "Export"  },
  { key: "print",   label: "Print"   },
  { key: "approve", label: "Approve" },
  { key: "cancel",  label: "Cancel"  },
  { key: "assign",  label: "Assign"  },
  { key: "manage",  label: "Manage"  },
];

const FIELD_SECTIONS = [
  {
    resource: "patients",
    label: "Patients",
    fields: [
      { key: "view_mobile",           label: "View Mobile Number"       },
      { key: "view_email",            label: "View Email"               },
      { key: "view_address",          label: "View Address"             },
      { key: "view_medical_history",  label: "View Medical History"     },
      { key: "view_allergies",        label: "View Allergies"           },
      { key: "view_treatment_notes",  label: "View Treatment Notes"     },
      { key: "view_billing_balance",  label: "View Billing Balance"     },
      { key: "edit_personal_info",    label: "Edit Personal Info"       },
      { key: "edit_medical_info",     label: "Edit Medical Info"        },
      { key: "edit_assigned_doctor",  label: "Change Assigned Doctor"   },
      { key: "archive_patient",       label: "Archive Patient"          },
    ],
  },
  {
    resource: "billing",
    label: "Billing",
    fields: [
      { key: "view_invoice_amount",       label: "View Invoice Amount"      },
      { key: "add_payment",               label: "Add Payment"              },
      { key: "apply_discount",            label: "Apply Discount"           },
      { key: "issue_refund",              label: "Issue Refund"             },
      { key: "cancel_invoice",            label: "Cancel Invoice"           },
      { key: "export_financial_reports",  label: "Export Financial Reports" },
    ],
  },
  {
    resource: "clinical_notes",
    label: "Clinical Notes",
    fields: [
      { key: "add_note",          label: "Add Note"              },
      { key: "edit_own_note",     label: "Edit Own Note"         },
      { key: "edit_any_note",     label: "Edit Any Note"         },
      { key: "delete_own_note",   label: "Delete Own Note"       },
      { key: "delete_any_note",   label: "Delete Any Note"       },
      { key: "view_doctor_only",  label: "View Doctor-Only Notes"},
    ],
  },
  {
    resource: "reports",
    label: "Reports",
    fields: [
      { key: "view_own_reports",        label: "View Own Reports"          },
      { key: "view_clinic_reports",     label: "View Clinic Reports"       },
      { key: "view_all_clinic_reports", label: "View All Clinic Reports"   },
      { key: "export_reports",          label: "Export Reports"            },
    ],
  },
];

// Default permission matrix (keys: "module:action")
function buildDefaultMatrix(): Record<string, Record<string, boolean>> {
  const all  = (mods: string[], acts?: string[]) => Object.fromEntries(
    (mods.length ? mods : MODULES.map(m => m.key)).flatMap(m =>
      (acts ?? ACTIONS.map(a => a.key)).map(a => [`${m}:${a}`, true])
    )
  );
  const none = () => Object.fromEntries(
    MODULES.flatMap(m => ACTIONS.map(a => [`${m.key}:${a.key}`, false]))
  );

  const superAdmin = all(MODULES.map(m => m.key));

  const clinicAdmin = { ...all(MODULES.map(m => m.key)) };
  clinicAdmin["users_roles:manage"] = false;

  const doctor = {
    ...none(),
    ...all(["dashboard","calendar"], ["view"]),
    ...all(["patients"],         ["view","edit"]),
    ...all(["appointments"],     ["view","create","edit","cancel"]),
    ...all(["treatments"],       ["view","create","edit"]),
    ...all(["clinical_notes"],   ["view","create","edit"]),
    ...all(["prescriptions"],    ["view","create","edit","print"]),
    "billing:view": true,
    "documents:view": true, "documents:create": true,
  };

  const receptionist = {
    ...none(),
    ...all(["dashboard","calendar"],   ["view"]),
    "calendar:create": true,
    ...all(["patients"],               ["view","create","edit"]),
    ...all(["appointments"],           ["view","create","edit","cancel","assign"]),
    ...all(["communication"],          ["view","create"]),
    "documents:view": true, "memberships:view": true,
  };

  const accountant = {
    ...none(),
    "dashboard:view": true,
    "patients:view": true,
    "appointments:view": true,
    ...all(["billing"],  ["view","create","edit","approve","print"]),
    ...all(["payments"], ["view","create","approve"]),
    "reports:view": true, "reports:export": true,
    "documents:view": true, "memberships:view": true, "memberships:create": true,
  };

  const inventory = {
    ...none(),
    "dashboard:view": true,
    ...all(["inventory"], ["view","create","edit","delete","manage"]),
    "reports:view": true,
  };

  const crm = {
    ...none(),
    "dashboard:view": true,
    ...all(["crm"],           ["view","create","edit","manage"]),
    "patients:view": true,
    ...all(["communication"], ["view","create","manage"]),
    "memberships:view": true,
  };

  const lab = {
    ...none(),
    "dashboard:view": true,
    ...all(["lab"],       ["view","create","edit","manage"]),
    "patients:view": true, "documents:view": true,
  };

  const readonly = {
    ...none(),
    "dashboard:view": true, "calendar:view": true, "appointments:view": true,
  };

  return {
    "super-admin":   superAdmin,
    "clinic-admin":  clinicAdmin,
    "doctor":        doctor,
    "receptionist":  receptionist,
    "accountant":    accountant,
    "inventory-mgr": inventory,
    "crm-exec":      crm,
    "lab-coord":     lab,
    "readonly":      readonly,
  };
}

// Default field-permission state
type FieldState = Record<string, Record<string, { can_view: boolean; can_edit: boolean }>>;
function buildDefaultFieldPerms(): FieldState {
  const base = () => Object.fromEntries(
    FIELD_SECTIONS.flatMap(s => s.fields.map(f => [`${s.resource}:${f.key}`, { can_view: false, can_edit: false }]))
  );
  const doctor = base();
  ["patients:view_mobile","patients:view_email","patients:view_address","patients:view_medical_history",
   "patients:view_allergies","patients:view_treatment_notes","patients:view_billing_balance",
   "patients:edit_medical_info","patients:edit_personal_info",
   "clinical_notes:add_note","clinical_notes:edit_own_note","clinical_notes:delete_own_note","clinical_notes:view_doctor_only",
   "reports:view_own_reports"].forEach(k => {
    const [r, f] = k.split(":");
    if (doctor[`${r}:${f}`]) { doctor[`${r}:${f}`].can_view = true; doctor[`${r}:${f}`].can_edit = true; }
  });

  const accountant = base();
  ["billing:view_invoice_amount","billing:add_payment","billing:apply_discount","billing:issue_refund","billing:cancel_invoice","billing:export_financial_reports",
   "patients:view_mobile","patients:view_email","patients:view_billing_balance",
   "reports:view_own_reports","reports:view_clinic_reports","reports:export_reports"].forEach(k => {
    const [r, f] = k.split(":");
    if (accountant[`${r}:${f}`]) { accountant[`${r}:${f}`].can_view = true; accountant[`${r}:${f}`].can_edit = true; }
  });

  return { "super-admin": base(), "clinic-admin": base(), "doctor": doctor,
    "receptionist": base(), "accountant": accountant, "inventory-mgr": base(),
    "crm-exec": base(), "lab-coord": base(), "readonly": base() };
}

const DEFAULT_ROLES: RoleLocal[] = [
  { id: "super-admin",   name: "Super Admin",       description: "Full access to everything across all clinics", is_system: true,  active: true,  user_count: 2,  scope: "all",      data_scope: "all_patients"    },
  { id: "clinic-admin",  name: "Clinic Admin",       description: "Full access within assigned clinic(s)",        is_system: true,  active: true,  user_count: 3,  scope: "selected", data_scope: "clinic_patients" },
  { id: "doctor",        name: "Doctor",             description: "Clinical access — own patients and notes",     is_system: true,  active: true,  user_count: 8,  scope: "own",      data_scope: "own_patients"    },
  { id: "receptionist",  name: "Receptionist",       description: "Front-desk — patients and appointments",       is_system: true,  active: true,  user_count: 5,  scope: "selected", data_scope: "clinic_patients" },
  { id: "accountant",    name: "Accountant",         description: "Billing, payments, financial reports",         is_system: true,  active: true,  user_count: 2,  scope: "selected", data_scope: "clinic_patients" },
  { id: "inventory-mgr", name: "Inventory Manager",  description: "Stock, vendors, purchases, consumption",       is_system: false, active: true,  user_count: 1,  scope: "selected", data_scope: "clinic_patients" },
  { id: "crm-exec",      name: "CRM Executive",      description: "Leads, follow-ups, campaigns",                is_system: false, active: true,  user_count: 2,  scope: "selected", data_scope: "clinic_patients" },
  { id: "lab-coord",     name: "Lab Coordinator",    description: "Lab orders, results, settings",               is_system: false, active: true,  user_count: 1,  scope: "selected", data_scope: "clinic_patients" },
  { id: "readonly",      name: "Read Only Staff",    description: "View dashboard and assigned schedules only",  is_system: false, active: false, user_count: 4,  scope: "own",      data_scope: "own_appointments" },
];

const MOCK_USERS: Record<string, Array<{ id: string; name: string; email: string; clinic: string; status: string; last_login: string }>> = {
  "doctor": [
    { id: "u1", name: "Dr. Anand Jasani",   email: "anand@dentosys.in",   clinic: "Speedwell Premium", status: "Active",   last_login: "2026-07-07 09:32" },
    { id: "u2", name: "Dr. Priya Patel",    email: "priya@dentosys.in",   clinic: "Virani Chowk",      status: "Active",   last_login: "2026-07-07 11:10" },
    { id: "u3", name: "Dr. Michael Foster", email: "michael@dentosys.in", clinic: "Speedwell Premium", status: "Active",   last_login: "2026-07-06 14:45" },
    { id: "u4", name: "Dr. Sarah Lee",      email: "sarah@dentosys.in",   clinic: "Kothariya",         status: "Inactive", last_login: "2026-06-30 08:00" },
  ],
  "receptionist": [
    { id: "u5", name: "Meera Shah",    email: "meera@dentosys.in",  clinic: "Speedwell Premium", status: "Active", last_login: "2026-07-07 08:55" },
    { id: "u6", name: "Kavya Doshi",   email: "kavya@dentosys.in",  clinic: "Virani Chowk",      status: "Active", last_login: "2026-07-07 09:01" },
  ],
};

// ── Tiny primitives ────────────────────────────────────────────

function Cb({ checked, onChange, label, indeterminate }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; indeterminate?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
      <div
        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0
          ${checked || indeterminate ? "bg-[#1e2d5a] border-[#1e2d5a]" : "border-gray-300 group-hover:border-[#1e2d5a]"}`}
        onClick={() => onChange(!checked)}>
        {indeterminate
          ? <div className="w-2 h-0.5 bg-white rounded" />
          : checked ? <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg> : null}
      </div>
      {label && <span className="text-xs text-gray-600">{label}</span>}
    </label>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function ScopeSelect<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value as T)}
        className="appearance-none border border-gray-200 rounded-lg bg-white px-3 py-2 pr-7 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-full">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Create Role Modal ─────────────────────────────────────────

function CreateRoleModal({ onClose, onSave, existingNames }: {
  onClose: () => void;
  onSave: (name: string, desc: string, copyFrom: string) => void;
  existingNames: string[];
}) {
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [copyFrom, setCopyFrom] = useState("—");
  const [err,      setErr]      = useState("");
  const save = () => {
    if (!name.trim()) { setErr("Role name is required."); return; }
    if (existingNames.includes(name.trim())) { setErr("A role with this name already exists."); return; }
    onSave(name.trim(), desc.trim(), copyFrom);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1e2d5a] text-base">Create New Role</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-500 mb-3">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Role Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a]" placeholder="e.g. Floor Manager" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a] resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Copy Permissions From</label>
            <div className="relative">
              <select value={copyFrom} onChange={e => setCopyFrom(e.target.value)}
                className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm outline-none focus:border-[#1e2d5a]">
                <option>—</option>
                {existingNames.map(n => <option key={n}>{n}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-[#1e2d5a] rounded-lg text-sm text-white hover:bg-[#1a2650]">Create Role</button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Save Modal ────────────────────────────────────────

function ConfirmSaveModal({ roleName, userCount, onConfirm, onClose }: {
  roleName: string; userCount: number; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">Save Permission Changes?</h3>
            <p className="text-sm text-gray-500 mt-1">
              This will affect <strong>{userCount} user{userCount !== 1 ? "s" : ""}</strong> assigned to the <strong>{roleName}</strong> role.
              Changes take effect immediately.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-[#1e2d5a] rounded-lg text-sm text-white hover:bg-[#1a2650]">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Assign User Modal ─────────────────────────────────────────

function AssignUserModal({ roleName, onClose }: { roleName: string; onClose: () => void }) {
  const [user,    setUser]    = useState("");
  const [clinics, setClinics] = useState<string[]>([]);
  const [date,    setDate]    = useState("");
  const allClinics = ["Speedwell Premium Division", "Virani Chowk", "Kothariya"];
  const toggle = (c: string) => setClinics(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const save = () => {
    if (!user) { toast.error("Please select a user"); return; }
    toast.success(`User assigned to ${roleName}`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1e2d5a]">Assign User to {roleName}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">User <span className="text-red-500">*</span></label>
            <input value={user} onChange={e => setUser(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a]"
              placeholder="Search name or email…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Clinic Access</label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              {allClinics.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={clinics.includes(c)} onChange={() => toggle(c)} className="accent-[#1e2d5a]" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Effective From</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a]" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-[#1e2d5a] rounded-lg text-sm text-white hover:bg-[#1a2650]">Assign</button>
        </div>
      </div>
    </div>
  );
}

// ── Permission Matrix ─────────────────────────────────────────

function PermissionMatrix({ roleId, roleName, matrix, onChange }: {
  roleId: string;
  roleName: string;
  matrix: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [grp,    setGrp]    = useState("All");

  const groups = ["All", ...Array.from(new Set(MODULES.map(m => m.group)))];

  const filtered = MODULES.filter(m =>
    (grp === "All" || m.group === grp) &&
    (!search || m.label.toLowerCase().includes(search.toLowerCase()))
  );

  const permKey = (mod: string, act: string) => `${mod}:${act}`;

  const setAll = (val: boolean) => {
    filtered.forEach(m => ACTIONS.forEach(a => onChange(permKey(m.key, a.key), val)));
  };
  const setViewOnly = () => {
    filtered.forEach(m => ACTIONS.forEach(a => onChange(permKey(m.key, a.key), a.key === "view")));
  };
  const setFullAccess = () => setAll(true);
  const setNoAccess   = () => setAll(false);

  const modChecked  = (mod: string) => ACTIONS.every(a => matrix[permKey(mod, a.key)]);
  const modPartial  = (mod: string) => !modChecked(mod) && ACTIONS.some(a => matrix[permKey(mod, a.key)]);
  const actChecked  = (act: string) => filtered.every(m => matrix[permKey(m.key, act)]);
  const actPartial  = (act: string) => !actChecked(act) && filtered.some(m => matrix[permKey(m.key, act)]);

  const toggleRow = (mod: string) => {
    const all = modChecked(mod);
    ACTIONS.forEach(a => onChange(permKey(mod, a.key), !all));
  };
  const toggleCol = (act: string) => {
    const all = actChecked(act);
    filtered.forEach(m => onChange(permKey(m.key, act), !all));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search module…"
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#1e2d5a]" />
        </div>
        <div className="relative">
          <select value={grp} onChange={e => setGrp(e.target.value)}
            className="appearance-none border border-gray-200 rounded-lg px-2.5 py-1.5 pr-7 text-xs outline-none focus:border-[#1e2d5a]">
            {groups.map(g => <option key={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex gap-1">
          <button onClick={setViewOnly}    className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 font-medium">View Only</button>
          <button onClick={setFullAccess}  className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-green-50 text-green-700 font-medium">Full Access</button>
          <button onClick={setNoAccess}    className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-red-50 text-red-600 font-medium">No Access</button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#1e2d5a]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/80 w-40 sticky left-0 bg-[#1e2d5a]">
                Module
              </th>
              {ACTIONS.map(a => (
                <th key={a.key} className="px-2 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Cb
                      checked={actChecked(a.key)}
                      indeterminate={actPartial(a.key)}
                      onChange={() => toggleCol(a.key)}
                    />
                    <span className="text-[10px] font-semibold text-white/80">{a.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((mod, i) => (
              <tr key={mod.key} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                <td className="px-4 py-2.5 sticky left-0 bg-inherit border-r border-gray-100">
                  <div className="flex items-center gap-2">
                    <Cb checked={modChecked(mod.key)} indeterminate={modPartial(mod.key)} onChange={() => toggleRow(mod.key)} />
                    <div>
                      <div className="font-medium text-gray-700 leading-tight">{mod.label}</div>
                      <div className="text-[9px] text-gray-400">{mod.group}</div>
                    </div>
                  </div>
                </td>
                {ACTIONS.map(a => (
                  <td key={a.key} className="px-2 py-2.5 text-center">
                    <Cb
                      checked={!!matrix[permKey(mod.key, a.key)]}
                      onChange={v => onChange(permKey(mod.key, a.key), v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Field Permissions Panel ───────────────────────────────────

function FieldPermissionsPanel({ roleId, fieldPerms, onChange }: {
  roleId: string;
  fieldPerms: Record<string, { can_view: boolean; can_edit: boolean }>;
  onChange: (key: string, cap: "can_view" | "can_edit", val: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      {FIELD_SECTIONS.map(section => (
        <div key={section.resource} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#1e2d5a]">{section.label}</h4>
            <div className="flex gap-4 text-[10px] font-semibold text-gray-400 pr-2">
              <span className="w-10 text-center">View</span>
              <span className="w-10 text-center">Edit</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {section.fields.map(field => {
              const key = `${section.resource}:${field.key}`;
              const fp  = fieldPerms[key] ?? { can_view: false, can_edit: false };
              return (
                <div key={field.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50">
                  <span className="text-xs text-gray-700">{field.label}</span>
                  <div className="flex gap-4 pr-2">
                    <div className="w-10 flex justify-center">
                      <Cb checked={fp.can_view} onChange={v => onChange(key, "can_view", v)} />
                    </div>
                    <div className="w-10 flex justify-center">
                      <Cb checked={fp.can_edit} onChange={v => {
                        onChange(key, "can_edit", v);
                        if (v) onChange(key, "can_view", true); // edit implies view
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Role Detail Panel ─────────────────────────────────────────

function RoleDetailPanel({ role, matrix, fieldPerms, activeTab, onTabChange, onMatrixChange, onFieldChange, onRoleChange, assignedUsers, usersLoading }: {
  role: RoleLocal;
  matrix: Record<string, boolean>;
  fieldPerms: Record<string, { can_view: boolean; can_edit: boolean }>;
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
  onMatrixChange: (key: string, val: boolean) => void;
  onFieldChange: (key: string, cap: "can_view" | "can_edit", val: boolean) => void;
  onRoleChange: (patch: Partial<RoleLocal>) => void;
  assignedUsers: AssignedUserRow[];
  usersLoading: boolean;
}) {
  const users = assignedUsers;
  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "permissions", label: "Permissions",    icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { key: "fields",      label: "Field Access",   icon: <Eye className="h-3.5 w-3.5" /> },
    { key: "users",       label: `Users (${role.user_count})`, icon: <Users className="h-3.5 w-3.5" /> },
    { key: "details",     label: "Role Details",   icon: <Edit3 className="h-3.5 w-3.5" /> },
  ];

  const [showAssign, setShowAssign] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Role header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${role.is_system ? "bg-[#1e2d5a]" : "bg-orange-100"}`}>
              {role.is_system ? <Lock className="h-4 w-4 text-white" /> : <Shield className="h-4 w-4 text-orange-600" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#1e2d5a] text-sm leading-tight">{role.name}</h3>
                {role.is_system && <Pill label="System" color="bg-blue-50 text-blue-700" />}
                <Pill label={role.active ? "Active" : "Inactive"} color={role.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{role.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-xs text-gray-500">Active</span>
              <button
                onClick={() => !role.is_system && onRoleChange({ active: !role.active })}
                disabled={role.is_system}
                className={`relative w-9 h-5 rounded-full transition-colors ${role.active ? "bg-green-500" : "bg-gray-300"} ${role.is_system ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${role.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-5 gap-0 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-[#1e2d5a] text-[#1e2d5a]"
                : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">

        {/* ── Permissions tab ── */}
        {activeTab === "permissions" && (
          <PermissionMatrix
            roleId={role.id}
            roleName={role.name}
            matrix={matrix}
            onChange={onMatrixChange}
          />
        )}

        {/* ── Field Access tab ── */}
        {activeTab === "fields" && (
          <FieldPermissionsPanel roleId={role.id} fieldPerms={fieldPerms} onChange={onFieldChange} />
        )}

        {/* ── Users tab ── */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">
                {usersLoading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""} assigned to this role`}
              </p>
              <button onClick={() => setShowAssign(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1e2d5a] text-white hover:bg-[#1a2650]">
                <Plus className="h-3.5 w-3.5" /> Assign User
              </button>
            </div>
            {usersLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No users assigned to this role yet.</div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Profile Role</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Branch / Clinic</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{u.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{u.role_in_profile || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-500">{u.clinic || "—"}</td>
                        <td className="px-4 py-2.5">
                          <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showAssign && <AssignUserModal roleName={role.name} onClose={() => setShowAssign(false)} />}
          </div>
        )}

        {/* ── Details tab ── */}
        {activeTab === "details" && (
          <div className="max-w-lg space-y-4">
            {/* Basic info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1e2d5a]">Basic Details</h4>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Role Name {role.is_system && <span className="text-gray-400">(system — cannot rename)</span>}</label>
                <input value={role.name} readOnly={role.is_system}
                  onChange={e => onRoleChange({ name: e.target.value })}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a] ${role.is_system ? "bg-gray-50 cursor-not-allowed" : ""}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
                <textarea value={role.description} onChange={e => onRoleChange({ description: e.target.value })} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e2d5a] resize-none" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {role.is_system ? <Lock className="h-3.5 w-3.5 text-gray-400" /> : <Shield className="h-3.5 w-3.5 text-orange-500" />}
                  <span className="text-xs text-gray-600">{role.is_system ? "System Role" : "Custom Role"}</span>
                </div>
                <Pill label={role.active ? "Active" : "Inactive"} color={role.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"} />
              </div>
            </div>

            {/* Clinic Scope */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1e2d5a] flex items-center gap-2"><Globe className="h-4 w-4" /> Clinic Scope</h4>
              <ScopeSelect<RoleLocal["scope"]>
                value={role.scope}
                onChange={v => onRoleChange({ scope: v })}
                options={[
                  { value: "all",      label: "All Clinics"          },
                  { value: "selected", label: "Selected Clinics Only" },
                  { value: "own",      label: "Own Clinic Only"       },
                ]}
              />
            </div>

            {/* Data Scope */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1e2d5a] flex items-center gap-2"><UserCheck className="h-4 w-4" /> Data Scope</h4>
              <ScopeSelect<RoleLocal["data_scope"]>
                value={role.data_scope}
                onChange={v => onRoleChange({ data_scope: v })}
                options={[
                  { value: "all_patients",    label: "All Patients"                     },
                  { value: "own_patients",    label: "Own Assigned Patients Only"        },
                  { value: "own_appointments",label: "Own Appointments Only"             },
                  { value: "own_records",     label: "Own Doctor Records Only"           },
                  { value: "clinic_patients", label: "Selected Clinic Patients Only"     },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Logs Panel ──────────────────────────────────────────

const SAMPLE_LOGS = [
  { id: "1", user: "Dr. Anand Jasani",   role: "Doctor",       module: "patients",    action: "view_patient",    record: "P001 Rajesh Kumar",   ip: "192.168.1.10", time: "2026-07-08 09:32", status: "Success" },
  { id: "2", user: "Meera Shah",          role: "Receptionist", module: "appointments",action: "create_appointment",record: "APT-0045",           ip: "192.168.1.14", time: "2026-07-08 09:45", status: "Success" },
  { id: "3", user: "Admin",               role: "Super Admin",  module: "users_roles", action: "change_role",     record: "Kavya Doshi",         ip: "192.168.1.1",  time: "2026-07-08 10:00", status: "Success" },
  { id: "4", user: "Dr. Priya Patel",    role: "Doctor",       module: "billing",     action: "view_billing",    record: "INV-0099",            ip: "192.168.1.11", time: "2026-07-08 10:12", status: "Denied"  },
  { id: "5", user: "Accountant User",     role: "Accountant",   module: "billing",     action: "add_payment",     record: "INV-0099",            ip: "192.168.1.20", time: "2026-07-08 10:14", status: "Success" },
  { id: "6", user: "Dr. Sarah Lee",      role: "Doctor",       module: "prescriptions","action": "export",        record: "P009 Karan Malhotra", ip: "192.168.1.12", time: "2026-07-08 10:30", status: "Denied"  },
];

function AuditLogsPanel() {
  const [filterModule, setFilterModule] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search,       setSearch]       = useState("");

  const filtered = SAMPLE_LOGS.filter(l =>
    (filterModule === "All" || l.module === filterModule) &&
    (filterStatus === "All" || l.status === filterStatus) &&
    (!search || l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or action…"
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#1e2d5a] w-48" />
        </div>
        <div className="relative">
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
            className="appearance-none border border-gray-200 rounded-lg px-2.5 py-1.5 pr-7 text-xs outline-none focus:border-[#1e2d5a]">
            <option>All</option>
            {Array.from(new Set(SAMPLE_LOGS.map(l => l.module))).map(m => <option key={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none border border-gray-200 rounded-lg px-2.5 py-1.5 pr-7 text-xs outline-none focus:border-[#1e2d5a]">
            <option>All</option><option>Success</option><option>Denied</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Date/Time","User","Role","Module","Action","Record","IP","Status"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{l.time}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{l.user}</td>
                <td className="px-3 py-2 text-gray-500">{l.role}</td>
                <td className="px-3 py-2">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{l.module}</span>
                </td>
                <td className="px-3 py-2 font-mono text-gray-600">{l.action}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-[120px]">{l.record}</td>
                <td className="px-3 py-2 text-gray-400 font-mono">{l.ip}</td>
                <td className="px-3 py-2">
                  <Pill
                    label={l.status}
                    color={l.status === "Success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}
                  />
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No audit logs match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────

export function RolesPermissions() {
  const [roles,          setRoles]          = useState<RoleLocal[]>([]);
  const [selectedId,     setSelectedId]     = useState<string>("");
  const [activeTab,      setActiveTab]      = useState<TabKey>("permissions");
  const [matrix,         setMatrix]         = useState<Record<string, Record<string, boolean>>>({});
  const [fieldPerms,     setFieldPerms]     = useState<Record<string, Record<string, { can_view: boolean; can_edit: boolean }>>>({});
  const [dirty,          setDirty]          = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [rolesLoading,   setRolesLoading]   = useState(true);
  const [permsLoading,   setPermsLoading]   = useState(false);
  const [assignedUsers,  setAssignedUsers]  = useState<AssignedUserRow[]>([]);
  const [usersLoading,   setUsersLoading]   = useState(false);
  const [showCreate,     setShowCreate]     = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showLogs,       setShowLogs]       = useState(false);
  const [searchRole,     setSearchRole]     = useState("");

  const selectedRole   = roles.find(r => r.id === selectedId);
  const currentMatrix  = matrix[selectedId]    ?? {};
  const currentFields  = fieldPerms[selectedId] ?? {};
  const filteredRoles  = roles.filter(r =>
    !searchRole || r.name.toLowerCase().includes(searchRole.toLowerCase())
  );

  // ── Load roles from Supabase ───────────────────────────────
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    const { data: rolesData, error } = await supabase
      .from("roles")
      .select("id, name, description, is_system, active, created_at")
      .order("is_system", { ascending: false })
      .order("name");

    if (error || !rolesData?.length) {
      // Fall back to mock data if DB is empty or not reachable
      setRoles(DEFAULT_ROLES);
      setSelectedId(DEFAULT_ROLES[0].id);
      setRolesLoading(false);
      return;
    }

    // Get user counts per role
    const { data: urRows } = await supabase
      .from("user_roles")
      .select("role_id");

    const countMap: Record<string, number> = {};
    (urRows ?? []).forEach((r: any) => {
      countMap[r.role_id] = (countMap[r.role_id] ?? 0) + 1;
    });

    const loaded: RoleLocal[] = rolesData.map((r: any) => ({
      id:          r.id,
      name:        r.name,
      description: r.description ?? "",
      is_system:   r.is_system,
      active:      r.active,
      user_count:  countMap[r.id] ?? 0,
      scope:       "selected" as const,
      data_scope:  "clinic_patients" as const,
    }));

    setRoles(loaded);
    setSelectedId(loaded[0].id);
    setRolesLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  // ── Load permissions for the selected role ─────────────────
  const loadRolePerms = useCallback(async (roleId: string) => {
    if (!roleId || matrix[roleId]) return; // already cached
    setPermsLoading(true);

    const emptyMatrix = Object.fromEntries(
      MODULES.flatMap(m => ACTIONS.map(a => [`${m.key}:${a.key}`, false]))
    );
    const emptyFields = Object.fromEntries(
      FIELD_SECTIONS.flatMap(s => s.fields.map(f => [`${s.resource}:${f.key}`, { can_view: false, can_edit: false }]))
    );

    const [rpRes, fpRes] = await Promise.all([
      supabase
        .from("role_permissions")
        .select("allowed, permissions(module, action)")
        .eq("role_id", roleId),
      supabase
        .from("field_permissions")
        .select("resource, field_name, can_view, can_edit")
        .eq("role_id", roleId),
    ]);

    // Build matrix from DB rows
    const permMatrix = { ...emptyMatrix };
    (rpRes.data ?? []).forEach((rp: any) => {
      if (rp.permissions)
        permMatrix[`${rp.permissions.module}:${rp.permissions.action}`] = !!rp.allowed;
    });

    // Build field map from DB rows
    const fieldMap = { ...emptyFields };
    (fpRes.data ?? []).forEach((fp: any) => {
      const key = `${fp.resource}:${fp.field_name}`;
      if (fieldMap[key] !== undefined)
        fieldMap[key] = { can_view: fp.can_view, can_edit: fp.can_edit };
    });

    setMatrix(prev  => ({ ...prev,  [roleId]: permMatrix }));
    setFieldPerms(prev => ({ ...prev, [roleId]: fieldMap    }));
    setPermsLoading(false);
  }, [matrix]);

  useEffect(() => {
    if (selectedId) loadRolePerms(selectedId);
  }, [selectedId, loadRolePerms]);

  // ── Load assigned users when Users tab is active ───────────
  const loadAssignedUsers = useCallback(async (roleId: string) => {
    if (!roleId) return;
    setUsersLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("id, profiles(id, name, role, branch_id, branches(name))")
      .eq("role_id", roleId);

    const rows: AssignedUserRow[] = (data ?? []).map((r: any) => ({
      id:              r.id,
      name:            r.profiles?.name ?? "Unknown",
      role_in_profile: r.profiles?.role ?? "",
      clinic:          (r.profiles as any)?.branches?.name ?? "",
    }));
    setAssignedUsers(rows);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "users" && selectedId) loadAssignedUsers(selectedId);
  }, [activeTab, selectedId, loadAssignedUsers]);

  // ── Handlers ──────────────────────────────────────────────
  const handleMatrixChange = useCallback((key: string, val: boolean) => {
    setMatrix(prev => ({ ...prev, [selectedId]: { ...prev[selectedId], [key]: val } }));
    setDirty(true);
  }, [selectedId]);

  const handleFieldChange = useCallback((key: string, cap: "can_view" | "can_edit", val: boolean) => {
    setFieldPerms(prev => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        [key]: { ...(prev[selectedId]?.[key] ?? { can_view: false, can_edit: false }), [cap]: val },
      },
    }));
    setDirty(true);
  }, [selectedId]);

  const handleRoleChange = useCallback((patch: Partial<RoleLocal>) => {
    setRoles(prev => prev.map(r => r.id === selectedId ? { ...r, ...patch } : r));
    setDirty(true);
  }, [selectedId]);

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      // role_permissions — upsert all 200 rows for this role
      const { data: allPerms } = await supabase.from("permissions").select("id, module, action");
      const permRows = (allPerms ?? []).map((p: any) => ({
        role_id:       selectedId,
        permission_id: p.id,
        allowed:       !!(currentMatrix[`${p.module}:${p.action}`]),
      }));
      if (permRows.length)
        await supabase.from("role_permissions").upsert(permRows, { onConflict: "role_id,permission_id" });

      // field_permissions — upsert all field rows for this role
      const fpRows = Object.entries(currentFields).map(([key, fp]) => {
        const [resource, field_name] = key.split(":");
        return { role_id: selectedId, resource, field_name, can_view: fp.can_view, can_edit: fp.can_edit };
      });
      if (fpRows.length)
        await supabase.from("field_permissions").upsert(fpRows, { onConflict: "role_id,resource,field_name" });

      await audit.updatePermission(selectedId, { role: selectedRole.name });
      toast.success(`Permissions saved for ${selectedRole.name}`);
    } catch (e: any) {
      toast.error("Save failed: " + (e?.message ?? "unknown error"));
    }
    setSaving(false);
    setDirty(false);
    setShowConfirm(false);
  };

  const handleReset = () => {
    // Clear cached matrix for this role so it reloads from DB
    setMatrix(prev  => { const n = { ...prev  }; delete n[selectedId]; return n; });
    setFieldPerms(prev => { const n = { ...prev }; delete n[selectedId]; return n; });
    setDirty(false);
    toast.success("Reloaded from database");
  };

  const handleCreateRole = async (name: string, desc: string, copyFrom: string) => {
    const { data: newRole, error } = await supabase
      .from("roles")
      .insert({ name, description: desc, is_system: false, active: true })
      .select()
      .single();

    if (error) { toast.error("Failed to create role: " + error.message); return; }

    // Copy permissions from source role if requested
    const copyId = roles.find(r => r.name === copyFrom)?.id;
    if (copyId) {
      const { data: srcPerms } = await supabase
        .from("role_permissions")
        .select("permission_id, allowed")
        .eq("role_id", copyId);
      if (srcPerms?.length) {
        await supabase.from("role_permissions").insert(
          srcPerms.map((p: any) => ({ role_id: newRole.id, permission_id: p.permission_id, allowed: p.allowed }))
        );
      }
    }

    const newLocal: RoleLocal = {
      id: newRole.id, name, description: desc, is_system: false, active: true,
      user_count: 0, scope: "own", data_scope: "clinic_patients",
    };
    setRoles(prev => [...prev, newLocal]);
    setSelectedId(newRole.id);
    setShowCreate(false);
    toast.success(`Role "${name}" created`);
  };

  const handleDuplicate = async (role: RoleLocal) => {
    const name = `${role.name} (Copy)`;
    const { data: newRole, error } = await supabase
      .from("roles")
      .insert({ name, description: role.description, is_system: false, active: true })
      .select().single();

    if (error) { toast.error("Duplicate failed: " + error.message); return; }

    // Copy permissions
    const { data: srcPerms } = await supabase
      .from("role_permissions").select("permission_id, allowed").eq("role_id", role.id);
    if (srcPerms?.length)
      await supabase.from("role_permissions").insert(
        srcPerms.map((p: any) => ({ role_id: newRole.id, permission_id: p.permission_id, allowed: p.allowed }))
      );

    setRoles(prev => [...prev, { ...role, id: newRole.id, name, is_system: false, user_count: 0 }]);
    // Pre-populate local cache from current matrix
    if (matrix[role.id]) setMatrix(prev => ({ ...prev, [newRole.id]: { ...prev[role.id] } }));
    setSelectedId(newRole.id);
    toast.success(`Duplicated as "${name}"`);
  };

  const handleDelete = async (role: RoleLocal) => {
    if (role.is_system) { toast.error("System roles cannot be deleted"); return; }
    if (role.user_count > 0) { toast.error(`Remove all ${role.user_count} users first`); return; }
    const { error } = await supabase.from("roles").delete().eq("id", role.id);
    if (error) { toast.error("Delete failed: " + error.message); return; }
    setRoles(prev => prev.filter(r => r.id !== role.id));
    if (selectedId === role.id) setSelectedId(roles[0]?.id ?? "");
    toast.success(`Role "${role.name}" deleted`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1e2d5a]">Roles &amp; Permissions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage what doctors and staff can view, create, edit, delete, export, and approve.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLogs(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <Clock className="h-3.5 w-3.5" /> Audit Logs
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1e2d5a] text-white rounded-lg hover:bg-[#1a2650]">
            <Plus className="h-3.5 w-3.5" /> Create Role
          </button>
          <button
            onClick={() => dirty ? setShowConfirm(true) : toast.info("No unsaved changes")}
            disabled={!dirty || saving}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors
              ${dirty ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-3 flex-shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          You have unsaved changes. Click <strong className="mx-0.5">Save Changes</strong> to apply them.
        </div>
      )}

      {/* Audit logs panel */}
      {showLogs && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1e2d5a] flex items-center gap-2"><Clock className="h-4 w-4" /> Access Audit Logs</h3>
            <button onClick={() => setShowLogs(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <AuditLogsPanel />
        </div>
      )}

      {/* Main split layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Left: Role list ── */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input value={searchRole} onChange={e => setSearchRole(e.target.value)} placeholder="Search roles…"
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-[#1e2d5a]" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {rolesLoading && [1,2,3,4,5].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 animate-pulse">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-2 w-36 bg-gray-100 rounded" />
              </div>
            ))}
            {!rolesLoading && filteredRoles.map(role => (
              <div key={role.id}
                className={`rounded-xl border p-3 cursor-pointer transition-all group ${
                  selectedId === role.id
                    ? "border-[#1e2d5a] bg-[#1e2d5a]/5"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"}`}
                onClick={() => { setSelectedId(role.id); setActiveTab("permissions"); }}>
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {role.is_system
                      ? <Lock className="h-3 w-3 text-[#1e2d5a] flex-shrink-0" />
                      : <Shield className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                    <span className={`text-xs font-semibold truncate ${selectedId === role.id ? "text-[#1e2d5a]" : "text-gray-700"}`}>
                      {role.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button title="Duplicate" onClick={e => { e.stopPropagation(); handleDuplicate(role); }}
                      className="p-0.5 rounded hover:bg-gray-200">
                      <Copy className="h-2.5 w-2.5 text-gray-500" />
                    </button>
                    <button title={role.is_system ? "System roles cannot be deleted" : "Delete"}
                      onClick={e => { e.stopPropagation(); handleDelete(role); }}
                      disabled={role.is_system}
                      className={`p-0.5 rounded ${role.is_system ? "opacity-30 cursor-not-allowed" : "hover:bg-red-100"}`}>
                      <Trash2 className="h-2.5 w-2.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{role.description}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-gray-400">
                    <Users className="h-2.5 w-2.5 inline mr-0.5" />{role.user_count}
                  </span>
                  <Pill label={role.active ? "Active" : "Inactive"} color={role.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"} />
                  {role.is_system && <Pill label="System" color="bg-blue-50 text-blue-700" />}
                </div>
              </div>
            ))}
            {!filteredRoles.length && (
              <div className="text-center py-8 text-gray-400 text-xs">No roles found.</div>
            )}
          </div>
        </div>

        {/* ── Right: Role detail ── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {permsLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-[#1e2d5a] border-t-transparent animate-spin" />
              Loading permissions…
            </div>
          ) : selectedRole ? (
            <RoleDetailPanel
              role={selectedRole}
              matrix={currentMatrix}
              fieldPerms={currentFields}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onMatrixChange={handleMatrixChange}
              onFieldChange={handleFieldChange}
              onRoleChange={handleRoleChange}
              assignedUsers={assignedUsers}
              usersLoading={usersLoading}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a role to manage permissions.</div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate  && <CreateRoleModal  existingNames={roles.map(r => r.name)} onClose={() => setShowCreate(false)} onSave={handleCreateRole} />}
      {showConfirm && <ConfirmSaveModal roleName={selectedRole?.name ?? ""} userCount={selectedRole?.user_count ?? 0} onConfirm={handleSave} onClose={() => setShowConfirm(false)} />}
    </div>
  );
}
