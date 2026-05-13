import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useBranches } from "../admin/primitives";
import {
  SPageHeader, SFormCard, SInput, SSelect, STable, SModal, SBadge,
  SToggle, SActionRow, NewButton, SaveButton, ResetBtn, fmtDate,
} from "./primitives";

const ROLES      = ["Admin","Doctor","Receptionist","Accountant","Inventory Manager","CRM Executive"];
const MODULES    = ["Dashboard","Patients","Appointments","Calendar","Reports","Admin","CRM","Billing","Inventory","Settings"];
const PERMS      = ["View","Create","Edit","Delete","Export"];

// ─── Users ────────────────────────────────────────────────────────────────────

export function Users() {
  const branches = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fFirst,    setFFirst]    = useState("");
  const [fLast,     setFLast]     = useState("");
  const [fEmail,    setFEmail]    = useState("");
  const [fPhone,    setFPhone]    = useState("");
  const [fRole,     setFRole]     = useState(ROLES[2]);
  const [fBranch,   setFBranch]   = useState("");
  const [fPass,     setFPass]     = useState("");
  const [fConfirm,  setFConfirm]  = useState("");

  const [fFilterRole, setFFilterRole]   = useState("All");
  const [fFilterStatus, setFFilterStatus] = useState("All");

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("id, name, email, role, branch_id, status, last_login, branches(name)");
    if (fFilterRole !== "All") q = q.eq("role", fFilterRole);
    const { data } = await q;
    let filtered = data ?? [];
    if (fFilterStatus !== "All") filtered = filtered.filter((r: any) => (r.status ?? "Active") === fFilterStatus);
    setRows(filtered);
    setLoading(false);
  }, [fFilterRole, fFilterStatus]);

  const reset = () => { setFFirst(""); setFLast(""); setFEmail(""); setFPhone(""); setFRole(ROLES[2]); setFBranch(""); setFPass(""); setFConfirm(""); setError(null); };

  const invite = async () => {
    if (!fEmail || !fFirst) { setError("First name and email are required."); return; }
    if (fPass && fPass !== fConfirm) { setError("Passwords do not match."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("profiles").insert({
      name:      `${fFirst} ${fLast}`.trim(),
      email:     fEmail, phone: fPhone || null,
      role:      fRole,
      branch_id: branchMap[fBranch] ?? null,
      status:    "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); reset(); load();
  };

  const toggleStatus = async (id: string, current: string) => {
    await supabase.from("profiles").update({ status: current === "Active" ? "Disabled" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Users" rightSlot={<NewButton onClick={() => { reset(); setModal(true); }} label="+ Add User" />} />

      {/* Filters */}
      <div className="flex items-end gap-3 mb-4 bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Role</label>
          <select value={fFilterRole} onChange={e => setFFilterRole(e.target.value)} className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#1e2d5a] w-36">
            {["All", ...ROLES].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Status</label>
          <select value={fFilterStatus} onChange={e => setFFilterStatus(e.target.value)} className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#1e2d5a] w-28">
            {["All","Active","Disabled"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={load} className="bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs font-semibold">View</button>
        <button onClick={() => { setFFilterRole("All"); setFFilterStatus("All"); setRows([]); }} className="border border-gray-300 text-gray-600 rounded px-4 py-1.5 text-xs">Reset</button>
      </div>

      <STable loading={loading}
        columns={["Name","Email","Role","Center","Status","Last Login","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.email ?? "—",
          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{r.role ?? "—"}</span>,
          (r as any).branches?.name ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          fmtDate(r.last_login),
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggleStatus(r.id, r.status ?? "Active")}
              className={`text-[10px] border rounded px-2 py-0.5 ${r.status === "Disabled" ? "border-green-200 text-green-600 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
              {r.status === "Disabled" ? "Enable" : "Disable"}
            </button>
          </div>,
        ])}
      />

      <SModal title="Add User" open={modal} onClose={() => setModal(false)} width="max-w-2xl">
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <SInput label="First Name"       value={fFirst}   onChange={setFFirst}   required />
            <SInput label="Last Name"        value={fLast}    onChange={setFLast} />
            <SInput label="Email"            value={fEmail}   onChange={setFEmail}   required type="email" />
            <SInput label="Mobile"           value={fPhone}   onChange={setFPhone} />
            <SSelect label="Role"            options={ROLES}  value={fRole}          onChange={setFRole} />
            <SSelect label="Assigned Center" options={["Select Center", ...branches.map(b => b.name)]} value={fBranch} onChange={setFBranch} />
            <SInput label="Password"         value={fPass}    onChange={setFPass}    type="password" />
            <SInput label="Confirm Password" value={fConfirm} onChange={setFConfirm} type="password" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={invite} loading={saving} label="CREATE USER" />
            <ResetBtn onClick={reset} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

export function Doctors() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, name, email, phone, status, branches(name)").eq("role", "Doctor");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  return (
    <div>
      <SPageHeader title="Doctors" rightSlot={<button onClick={load} className="bg-[#1e2d5a] text-white rounded-lg px-4 py-2 text-xs font-semibold">Load Doctors</button>} />
      <STable loading={loading}
        columns={["Name","Email","Phone","Center","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.email ?? "—", r.phone ?? "—",
          (r as any).branches?.name ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>,
        ])}
      />
    </div>
  );
}

// ─── Staff Members ────────────────────────────────────────────────────────────

export function StaffMembers() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, name, email, phone, role, status").not("role", "eq", "Doctor");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  return (
    <div>
      <SPageHeader title="Staff Members" rightSlot={<button onClick={load} className="bg-[#1e2d5a] text-white rounded-lg px-4 py-2 text-xs font-semibold">Load Staff</button>} />
      <STable loading={loading}
        columns={["Name","Email","Phone","Role","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.email ?? "—", r.phone ?? "—",
          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{r.role ?? "—"}</span>,
          <SBadge status={r.status ?? "Active"} />,
          <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>,
        ])}
      />
    </div>
  );
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────

export function RolesPermissions() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const m: Record<string, Record<string, boolean>> = {};
    ROLES.forEach(r => {
      m[r] = {};
      MODULES.forEach(mod => {
        PERMS.forEach(perm => {
          m[r][`${mod}_${perm}`] = r === "Admin";
        });
      });
    });
    // Set default perms for Doctor
    ["Patients","Appointments","Calendar"].forEach(mod => {
      ["View","Create","Edit"].forEach(p => { m["Doctor"][`${mod}_${p}`] = true; });
    });
    // Receptionist
    ["Patients","Appointments","Calendar","Billing"].forEach(mod => {
      ["View","Create","Edit"].forEach(p => { m["Receptionist"][`${mod}_${p}`] = true; });
    });
    return m;
  });
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [saving, setSaving] = useState(false);

  const toggle = (mod: string, perm: string) => {
    setMatrix(prev => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [`${mod}_${perm}`]: !prev[activeRole]?.[`${mod}_${perm}`] }
    }));
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("clinic_settings").upsert(
      ROLES.map(r => ({ key: `role_perms_${r.toLowerCase().replace(/\s/g, "_")}`, value: JSON.stringify(matrix[r]), updated_at: new Date().toISOString() })),
      { onConflict: "key" }
    );
    setSaving(false);
  };

  return (
    <div>
      <SPageHeader title="Roles & Permissions" subtitle="Configure what each role can access and do" />
      {/* Role tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ROLES.map(r => (
          <button key={r} onClick={() => setActiveRole(r)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${activeRole === r ? "bg-[#1e2d5a] text-white border-[#1e2d5a]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#1e2d5a] text-white">
                <th className="px-4 py-2.5 text-left text-xs font-semibold w-40">Module</th>
                {PERMS.map(p => <th key={p} className="px-4 py-2.5 text-center text-xs font-semibold">{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod, i) => (
                <tr key={mod} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-2.5 text-xs font-medium text-gray-700">{mod}</td>
                  {PERMS.map(perm => (
                    <td key={perm} className="px-4 py-2.5 text-center">
                      <input type="checkbox"
                        checked={!!matrix[activeRole]?.[`${mod}_${perm}`]}
                        onChange={() => toggle(mod, perm)}
                        className="accent-[#1e2d5a] w-4 h-4 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-3">
        <SaveButton onClick={save} loading={saving} />
      </div>
    </div>
  );
}

// ─── Access Control ───────────────────────────────────────────────────────────

export function AccessControl() {
  const [ipWhitelist, setIpWhitelist] = useState("192.168.1.0/24\n10.0.0.1");
  const [mfa,         setMfa]         = useState(false);
  const [loginAttempts, setLoginAttempts] = useState("5");
  const [lockDuration,  setLockDuration]  = useState("30");

  return (
    <div>
      <SPageHeader title="Access Control" subtitle="Manage login security and IP restrictions" />
      <SFormCard title="Login Security">
        <div className="space-y-4">
          <SToggle label="Require Multi-Factor Authentication (MFA)" checked={mfa} onChange={setMfa}
            description="Users will be prompted for a one-time code on each login" />
          <div className="grid grid-cols-2 gap-4">
            <SInput label="Max Failed Login Attempts"    value={loginAttempts}  onChange={setLoginAttempts} type="number" />
            <SInput label="Account Lockout Duration (min)" value={lockDuration} onChange={setLockDuration}  type="number" />
          </div>
        </div>
      </SFormCard>
      <SFormCard title="IP Whitelist">
        <p className="text-xs text-gray-500 mb-2">One IP address or CIDR range per line. Leave blank to allow all.</p>
        <textarea value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 outline-none focus:border-[#1e2d5a]" />
        <SActionRow onSave={() => {}} onReset={() => setIpWhitelist("")} />
      </SFormCard>
    </div>
  );
}
