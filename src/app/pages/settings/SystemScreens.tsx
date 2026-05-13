import { useState, useCallback, useEffect } from "react";
import { Database, Shield, Key, Plug, Clock, RefreshCw } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  SPageHeader, SFormCard, SInput, SSelect, STable, SToggle,
  SBadge, SActionRow, DangerButton, SaveButton, fmtDate,
} from "./primitives";

// ─── Backup & Restore ─────────────────────────────────────────────────────────

export function BackupRestore() {
  const [freq,     setFreq]     = useState("Daily");
  const [location, setLocation] = useState("Cloud (Supabase)");
  const [running,  setRunning]  = useState(false);
  const [lastBackup] = useState("09 May 2026 02:00 AM");

  const runBackup = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setRunning(false);
    alert("Backup initiated. You will receive an email when complete.");
  };

  return (
    <div>
      <SPageHeader title="Backup & Restore" subtitle="Manage data backups and restoration points" />

      {/* Status card */}
      <div className="bg-[#1e2d5a] text-white rounded-xl p-5 mb-5 flex items-center gap-4">
        <Database className="h-10 w-10 opacity-60" />
        <div className="flex-1">
          <div className="text-sm font-semibold mb-0.5">Last Backup</div>
          <div className="text-lg font-bold">{lastBackup}</div>
          <div className="text-xs opacity-60 mt-0.5">All data backed up successfully</div>
        </div>
        <button onClick={runBackup} disabled={running}
          className="bg-white text-[#1e2d5a] rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-100 disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          {running ? "Running..." : "Backup Now"}
        </button>
      </div>

      <SFormCard title="Backup Settings">
        <div className="grid grid-cols-2 gap-4">
          <SSelect label="Backup Frequency" options={["Daily","Weekly","Monthly"]}       value={freq}     onChange={setFreq} />
          <SSelect label="Backup Location"  options={["Cloud (Supabase)","Local Server","AWS S3"]} value={location} onChange={setLocation} />
        </div>
        <SActionRow onSave={() => {}} onReset={() => {}} />
      </SFormCard>

      <SFormCard title="Restore">
        <p className="text-xs text-gray-500 mb-4">Restore your data from a previous backup. This action cannot be undone.</p>
        <SSelect label="Select Backup Point" options={["09 May 2026 02:00 AM","08 May 2026 02:00 AM","07 May 2026 02:00 AM"]} value="09 May 2026 02:00 AM" onChange={() => {}} />
        <div className="mt-4">
          <DangerButton onClick={() => confirm("Are you sure? This will overwrite current data.") && alert("Restore initiated.")} label="Restore from Backup" />
        </div>
      </SFormCard>
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export function AuditLogs() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fFrom,   setFFrom]   = useState("");
  const [fTo,     setFTo]     = useState("");
  const [fType,   setFType]   = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (fFrom) q = q.gte("created_at", fFrom);
    if (fTo)   q = q.lte("created_at", fTo + "T23:59:59");
    if (fType !== "All") q = q.eq("action", fType);
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [fFrom, fTo, fType]);

  const ACTION_TYPES = ["All","INSERT","UPDATE","DELETE","LOGIN","LOGOUT","EXPORT"];

  return (
    <div>
      <SPageHeader title="Audit Logs" subtitle="Track all user actions and system events" />

      <div className="flex items-end gap-3 mb-4 bg-white border border-gray-200 rounded-lg px-4 py-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">From</label>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)}
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#1e2d5a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">To</label>
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)}
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#1e2d5a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Action Type</label>
          <select value={fType} onChange={e => setFType(e.target.value)} className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#1e2d5a] w-32">
            {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={load} className="bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs font-semibold">View Logs</button>
        <button onClick={() => setRows([])} className="border border-gray-300 text-gray-600 rounded px-4 py-1.5 text-xs">Reset</button>
      </div>

      <STable loading={loading}
        columns={["Timestamp","User","Action","Table / Resource","Details"]}
        rows={rows.map(r => [
          <span className="font-mono text-[10px]">{fmtDate(r.created_at)}</span>,
          r.user_email ?? r.user_id?.slice(0,8) ?? "—",
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.action==="DELETE"?"bg-red-100 text-red-700":r.action==="INSERT"?"bg-green-100 text-green-700":r.action==="LOGIN"?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-600"}`}>{r.action ?? "—"}</span>,
          r.table_name ?? r.resource ?? "—",
          <span className="text-[10px] text-gray-500 max-w-[200px] block truncate">{r.details ?? r.description ?? "—"}</span>,
        ])}
      />
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Google Calendar",    description: "Sync appointments with Google Calendar",    connected: false, icon: "📅" },
  { name: "WhatsApp Business",  description: "Send messages via WhatsApp Business API",   connected: true,  icon: "💬" },
  { name: "Razorpay",           description: "Accept online payments via Razorpay",       connected: false, icon: "💳" },
  { name: "Practo",             description: "Sync patient bookings from Practo",         connected: false, icon: "🏥" },
  { name: "JustDial",           description: "Receive leads from JustDial listings",      connected: false, icon: "📞" },
  { name: "Tally",              description: "Export billing data to Tally ERP",          connected: false, icon: "📊" },
];

export function Integrations() {
  const [list, setList] = useState(INTEGRATIONS);
  const toggle = (i: number) => setList(prev => prev.map((x, j) => j === i ? { ...x, connected: !x.connected } : x));

  return (
    <div>
      <SPageHeader title="Integrations" subtitle="Connect third-party services and tools" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((item, i) => (
          <div key={item.name} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="text-3xl">{item.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1e2d5a]">{item.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SBadge status={item.connected ? "Active" : "Inactive"} />
              <button onClick={() => toggle(i)}
                className={`text-xs px-3 py-1 rounded border font-medium transition ${item.connected ? "border-red-200 text-red-500 hover:bg-red-50" : "border-[#1e2d5a] text-[#1e2d5a] hover:bg-[#1e2d5a] hover:text-white"}`}>
                {item.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export function ApiKeys() {
  const [keys, setKeys] = useState([
    { name: "Production API Key", key: "sk_live_•••••••••••••••••••••••••••xyz", created: "01 Jan 2026", status: "Active" },
    { name: "Test API Key",       key: "sk_test_•••••••••••••••••••••••••••abc", created: "01 Jan 2026", status: "Active" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");

  return (
    <div>
      <SPageHeader title="API Keys" subtitle="Manage API keys for external integrations"
        rightSlot={<NewButton onClick={() => setModal(true)} label="+ Generate Key" />} />
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 font-medium">Keep your API keys secret. Never share them publicly or commit them to version control.</p>
      </div>
      <STable
        columns={["Name","Key","Created","Status","Actions"]}
        rows={keys.map((k, i) => [
          <span className="font-medium">{k.name}</span>,
          <span className="font-mono text-xs text-gray-500">{k.key}</span>,
          k.created,
          <SBadge status={k.status} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Reveal</button>
            <button onClick={() => setKeys(p => p.filter((_,j) => j!==i))} className="text-[10px] border border-red-200 text-red-500 rounded px-2 py-0.5 hover:bg-red-50">Revoke</button>
          </div>,
        ])}
      />
      <div className="p-3 bg-white border border-dashed border-gray-200 rounded-xl text-center mt-2">
        <Plug className="h-6 w-6 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">API documentation available at <span className="text-[#1e2d5a] font-medium">api.citydental.in/docs</span></p>
      </div>
    </div>
  );
}

// ─── Security Settings ────────────────────────────────────────────────────────

export function SecuritySettings() {
  const [minLen,    setMinLen]    = useState("8");
  const [reqUpper,  setReqUpper]  = useState(true);
  const [reqNum,    setReqNum]    = useState(true);
  const [reqSpec,   setReqSpec]   = useState(true);
  const [passExpiry,setPassExpiry]= useState("90");
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "sec_min_password_length",   value: minLen },
      { key: "sec_require_uppercase",     value: String(reqUpper) },
      { key: "sec_require_numbers",       value: String(reqNum) },
      { key: "sec_require_special_chars", value: String(reqSpec) },
      { key: "sec_password_expiry_days",  value: passExpiry },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Security Settings" subtitle="Configure password policies and security requirements" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Security settings saved.</div>}
      <SFormCard title="Password Policy">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <SInput  label="Minimum Password Length"   value={minLen}     onChange={setMinLen}     type="number" />
            <SInput  label="Password Expiry (days)"    value={passExpiry} onChange={setPassExpiry}  type="number" />
          </div>
          <SToggle label="Require uppercase letters"    checked={reqUpper} onChange={setReqUpper} />
          <SToggle label="Require numbers"              checked={reqNum}   onChange={setReqNum} />
          <SToggle label="Require special characters"   checked={reqSpec}  onChange={setReqSpec} />
        </div>
        <SActionRow onSave={save} onReset={() => {}} saving={saving} />
      </SFormCard>
    </div>
  );
}

// ─── Session Timeout ──────────────────────────────────────────────────────────

export function SessionTimeout() {
  const [timeout,   setTimeout_]  = useState("30");
  const [forceOut,  setForceOut]  = useState(true);
  const [rememberMe,setRememberMe]= useState(false);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "session_timeout_minutes",      value: timeout },
      { key: "session_force_logout_inactive",value: String(forceOut) },
      { key: "session_remember_me_enabled",  value: String(rememberMe) },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Session Timeout" subtitle="Control how long users remain logged in when inactive" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Session settings saved.</div>}
      <SFormCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#1e2d5a]" />
            <SInput label="Session Timeout (minutes)" value={timeout} onChange={setTimeout_} type="number" />
          </div>
          <SToggle label="Force logout inactive users" checked={forceOut} onChange={setForceOut}
            description="Automatically log out users after the session timeout period" />
          <SToggle label="Allow 'Remember Me' option" checked={rememberMe} onChange={setRememberMe}
            description="Let users stay logged in for 30 days on trusted devices" />
        </div>
        <SActionRow onSave={save} onReset={() => {}} saving={saving} />
      </SFormCard>
    </div>
  );
}
