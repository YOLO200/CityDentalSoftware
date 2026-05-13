import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  SPageHeader, SFormCard, SInput, SSelect, SColorInput, STable, SModal,
  SToggle, SBadge, SActionRow, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── Appointment Categories + Colors + Duration (combined) ────────────────────

export function AppointmentCategories() {
  const { user }  = useAuth();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fColor,    setFColor]    = useState("#1e2d5a");
  const [fDuration, setFDuration] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("appointment_categories").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setFName(""); setFColor("#1e2d5a"); setFDuration("30"); setError(null); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setFName(r.name); setFColor(r.color ?? "#1e2d5a"); setFDuration(String(r.duration_minutes ?? 30)); setError(null); setModal(true); };

  const save = async () => {
    if (!fName) { setError("Category name is required."); return; }
    setSaving(true); setError(null);
    const payload = { name: fName, color: fColor, duration_minutes: Number(fDuration) || 30, status: "Active" };
    const { error: err } = editing
      ? await supabase.from("appointment_categories").update(payload).eq("id", editing.id)
      : await supabase.from("appointment_categories").insert({ ...payload });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("appointment_categories").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Appointment Categories" subtitle="Define categories, colours and default durations"
        rightSlot={<NewButton onClick={openAdd} label="+ Add Category" />} />
      <STable loading={loading}
        columns={["Category","Color","Default Duration","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: r.color ?? "#1e2d5a" }} />
            <span className="font-mono text-[10px] text-gray-500">{r.color ?? "#1e2d5a"}</span>
          </div>,
          `${r.duration_minutes ?? 30} min`,
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">
              {r.status === "Active" ? "Disable" : "Enable"}
            </button>
          </div>,
        ])}
      />
      <SModal title={editing ? "Edit Category" : "Add Category"} open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput      label="Category Name"     value={fName}     onChange={setFName}     required />
          <SColorInput label="Color"             value={fColor}    onChange={setFColor} />
          <SInput      label="Default Duration (minutes)" value={fDuration} onChange={setFDuration} type="number" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label={editing ? "UPDATE" : "CREATE"} />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Appointment Colors ───────────────────────────────────────────────────────

export function AppointmentColors() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("appointment_categories").select("id, name, color").order("name").then(({ data }) => {
      setRows(data ?? []);
      setLoading(false);
    });
  }, []);

  const updateColor = async (id: string, color: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, color } : r));
    await supabase.from("appointment_categories").update({ color }).eq("id", id);
  };

  return (
    <div>
      <SPageHeader title="Appointment Colors" subtitle="Assign colors to appointment categories for the calendar" />
      {loading ? <div className="h-20 animate-pulse bg-gray-100 rounded-xl" /> : (
        <SFormCard>
          <div className="space-y-3">
            {rows.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No categories yet. Add some from Appointment Categories.</p>}
            {rows.map(r => (
              <div key={r.id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-48">{r.name}</span>
                <input type="color" value={r.color ?? "#1e2d5a"} onChange={e => updateColor(r.id, e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-gray-300 p-0.5" />
                <span className="font-mono text-xs text-gray-500">{r.color ?? "#1e2d5a"}</span>
                <div className="w-20 h-4 rounded-full" style={{ backgroundColor: r.color ?? "#1e2d5a" }} />
              </div>
            ))}
          </div>
        </SFormCard>
      )}
    </div>
  );
}

// ─── Appointment Duration ─────────────────────────────────────────────────────

export function AppointmentDuration() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("appointment_categories").select("id, name, duration_minutes").order("name").then(({ data }) => {
      setRows(data ?? []);
      setLoading(false);
    });
  }, []);

  const updateDuration = async (id: string, val: string) => {
    const mins = Number(val);
    if (!mins) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, duration_minutes: mins } : r));
    await supabase.from("appointment_categories").update({ duration_minutes: mins }).eq("id", id);
  };

  const DURATION_OPTIONS = ["15","20","30","45","60","90","120"];

  return (
    <div>
      <SPageHeader title="Appointment Duration" subtitle="Set default durations per appointment category" />
      {loading ? <div className="h-20 animate-pulse bg-gray-100 rounded-xl" /> : (
        <SFormCard>
          <div className="space-y-3">
            {rows.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No categories yet.</p>}
            {rows.map(r => (
              <div key={r.id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-48">{r.name}</span>
                <select value={String(r.duration_minutes ?? 30)} onChange={e => updateDuration(r.id, e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#1e2d5a]">
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
            ))}
          </div>
        </SFormCard>
      )}
    </div>
  );
}

// ─── Reminder Rules ───────────────────────────────────────────────────────────

export function ReminderRules() {
  const [smsHours,   setSmsHours]   = useState("24");
  const [waHours,    setWaHours]    = useState("2");
  const [emailHours, setEmailHours] = useState("48");
  const [smsEnabled,   setSmsEnabled]   = useState(true);
  const [waEnabled,    setWaEnabled]    = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "reminder_sms_hours",   value: smsHours },
      { key: "reminder_wa_hours",    value: waHours },
      { key: "reminder_email_hours", value: emailHours },
      { key: "reminder_sms_enabled",   value: String(smsEnabled) },
      { key: "reminder_wa_enabled",    value: String(waEnabled) },
      { key: "reminder_email_enabled", value: String(emailEnabled) },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Reminder Rules" subtitle="Configure when automated reminders are sent to patients" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Rules saved.</div>}
      <SFormCard>
        <div className="space-y-4 divide-y divide-gray-100">
          {[
            { label: "SMS Reminder", enabled: smsEnabled, setEnabled: setSmsEnabled, hours: smsHours, setHours: setSmsHours, color: "bg-blue-500" },
            { label: "WhatsApp Reminder", enabled: waEnabled, setEnabled: setWaEnabled, hours: waHours, setHours: setWaHours, color: "bg-green-500" },
            { label: "Email Reminder", enabled: emailEnabled, setEnabled: setEmailEnabled, hours: emailHours, setHours: setEmailHours, color: "bg-purple-500" },
          ].map(item => (
            <div key={item.label} className="py-4 first:pt-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <SToggle label="" checked={item.enabled} onChange={item.setEnabled} />
              </div>
              {item.enabled && (
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-gray-500">Send reminder</span>
                  <input type="number" value={item.hours} onChange={e => item.setHours(e.target.value)} min="1"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-[#1e2d5a]" />
                  <span className="text-xs text-gray-500">hours before appointment</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <SActionRow onSave={save} onReset={() => {}} saving={saving} />
      </SFormCard>
    </div>
  );
}

// ─── Follow-up Rules ──────────────────────────────────────────────────────────

export function FollowUpRules() {
  const [autoFollowup, setAutoFollowup]   = useState(true);
  const [followupDays, setFollowupDays]   = useState("7");
  const [recallMonths, setRecallMonths]   = useState("6");
  const [recallEnabled, setRecallEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "followup_auto_enabled", value: String(autoFollowup) },
      { key: "followup_days",         value: followupDays },
      { key: "recall_months",         value: recallMonths },
      { key: "recall_enabled",        value: String(recallEnabled) },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Follow-up Rules" subtitle="Automate post-treatment follow-ups and recall reminders" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Rules saved.</div>}
      <SFormCard title="Post-Treatment Follow-up">
        <SToggle label="Enable automatic follow-up reminders after treatment" checked={autoFollowup} onChange={setAutoFollowup}
          description="Sends a follow-up message N days after the appointment" />
        {autoFollowup && (
          <div className="flex items-center gap-3 mt-3 ml-4">
            <span className="text-xs text-gray-500">Send follow-up after</span>
            <input type="number" value={followupDays} onChange={e => setFollowupDays(e.target.value)} min="1"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-[#1e2d5a]" />
            <span className="text-xs text-gray-500">days</span>
          </div>
        )}
      </SFormCard>
      <SFormCard title="Recall Reminders">
        <SToggle label="Enable periodic recall reminders for inactive patients" checked={recallEnabled} onChange={setRecallEnabled}
          description="Reminds patients who haven't visited in a set number of months" />
        {recallEnabled && (
          <div className="flex items-center gap-3 mt-3 ml-4">
            <span className="text-xs text-gray-500">Remind patients inactive for more than</span>
            <input type="number" value={recallMonths} onChange={e => setRecallMonths(e.target.value)} min="1"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-[#1e2d5a]" />
            <span className="text-xs text-gray-500">months</span>
          </div>
        )}
      </SFormCard>
      <SActionRow onSave={save} onReset={() => {}} saving={saving} />
    </div>
  );
}
