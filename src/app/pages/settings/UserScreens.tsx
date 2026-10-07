import { useState, useCallback, useEffect } from "react";
export { RolesPermissions } from "./RolesPermissionsScreen";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useBranches } from "../admin/primitives";
import {
  SPageHeader, SFormCard, SInput, SSelect, STable, SModal, SBadge,
  SToggle, SActionRow, NewButton, SaveButton, ResetBtn, fmtDate, SMultiCheck,
} from "./primitives";

const ROLES      = ["Admin","Doctor","Receptionist","Accountant","Inventory Manager","CRM Executive"];

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
  const [fRole,     setFRole]     = useState("");
  // Several centres per user: the first becomes their home branch
  // (profiles.branch_id), all of them become user_clinics rows.
  const [fBranches, setFBranches] = useState<string[]>([]);
  const [notice,    setNotice]    = useState<string | null>(null);

  // Real RBAC roles, not the hardcoded ROLES list: this choice becomes a
  // user_roles row, which is what actually grants permissions.
  const [roleOptions, setRoleOptions] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase.from("roles").select("id, name").eq("active", true).order("name")
      .then(({ data }) => setRoleOptions(data ?? []));
  }, []);

  const [fFilterRole, setFFilterRole]   = useState("All");
  const [fFilterStatus, setFFilterStatus] = useState("All");

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

  const reset = () => { setFFirst(""); setFLast(""); setFEmail(""); setFRole(""); setFBranches([]); setError(null); setNotice(null); };

  // Sends an invite email. The account is created server-side by the
  // invite-user Edge Function, because inviting requires the service-role key
  // and that must never reach the browser. No password is set here — the
  // invited user chooses their own via the emailed link.
  const invite = async () => {
    const missing = [
      !fFirst.trim() && "First name",
      !fEmail.trim() && "Email",
      !fRole && "Role",
      fBranches.length === 0 && "At least one center",
    ].filter(Boolean) as string[];

    if (missing.length) { setError(`Required: ${missing.join(", ")}.`); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fEmail.trim())) {
      setError("Enter a valid email address."); return;
    }

    setSaving(true); setError(null); setNotice(null);

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setError("Your session expired. Sign in again."); setSaving(false); return; }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email:     fEmail.trim(),
            name:      `${fFirst} ${fLast}`.trim(),
            roleId:    fRole,
            branchIds: fBranches,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `Invite failed (HTTP ${res.status}).`);
        setSaving(false);
        return;
      }
      setNotice(`Invite sent to ${body.email ?? fEmail.trim()}.`);
      reset();
      setModal(false);
      load();
    } catch (e) {
      // A network-level failure here usually means the Edge Function was never
      // deployed — the browser gets a CORS/404 rather than a JSON error.
      setError(
        `Could not reach the invite service: ${(e as Error).message}. ` +
        `Check that the invite-user Edge Function is deployed.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    await supabase.from("profiles").update({ status: current === "Active" ? "Disabled" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Users" rightSlot={<NewButton onClick={() => { reset(); setModal(true); }} label="+ Invite User" />} />

      {/* Shown after the modal closes, so the admin sees the invite actually went. */}
      {notice && (
        <div className="mb-4 flex items-center justify-between rounded border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-700">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-green-600 hover:underline">Dismiss</button>
        </div>
      )}

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

      <SModal title="Invite User" open={modal} onClose={() => setModal(false)} width="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            The user receives an email invitation and sets their own password. Their role
            and assigned centers are fixed here and cannot be changed by them.
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <SInput label="First Name" value={fFirst} onChange={setFFirst} required />
            <SInput label="Last Name"  value={fLast}  onChange={setFLast} />
            <SInput label="Email"      value={fEmail} onChange={setFEmail} required type="email" />
            <SSelect
              label="Role" required value={fRole} onChange={setFRole}
              options={[{ value: "", label: "Select Role" },
                        ...roleOptions.map(r => ({ value: r.id, label: r.name }))]}
            />
            <SMultiCheck
              label="Assigned Centers" required
              className="col-span-2"
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              selected={fBranches}
              onChange={setFBranches}
              emptyText="No centers available"
            />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={invite} loading={saving} label="SEND INVITE" />
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
