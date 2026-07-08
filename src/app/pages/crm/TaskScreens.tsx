import { useState, useCallback, useEffect } from "react";
import { Plus, Bell, RefreshCw, MoreVertical } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useProfiles, useBranches } from "../admin/primitives";
import {
  CRMPageHeader, CRMTable, CRMStatusBadge, CRMModal, CRMFilterBar,
  KPICard, PrimaryBtn, GhostBtn, CInput, CSelect, CDate, CTextarea,
  PRIORITIES, TASK_CATEGORIES, fmtDate,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];
const FREQ_OPTIONS = ["Daily","Weekly","Fortnightly","Monthly","Quarterly","Yearly"];

// ─── Task List ────────────────────────────────────────────────────────────────

export function TaskList() {
  const { user }  = useAuth();
  const profiles  = useProfiles();
  const [tasks,   setTasks]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fFilter, setFFilter] = useState("All");

  const [fTitle,    setFTitle]    = useState("");
  const [fCategory, setFCategory] = useState(TASK_CATEGORIES[0]);
  const [fPatient,  setFPatient]  = useState("");
  const [fAssigned, setFAssigned] = useState("");
  const [fDue,      setFDue]      = useState(today());
  const [fPriority, setFPriority] = useState("Medium");
  const [fNotes,    setFNotes]    = useState("");

  const profileMap = Object.fromEntries(profiles.map(p => [p.name, p.id]));
  const profileIdMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("crm_tasks").select("*").order("due_date");
    if (fFilter !== "All") q = q.eq("status", fFilter);
    const { data } = await q;
    setTasks((data ?? []).map((t: any) => ({
      ...t,
      assigned_name: t.assigned_label ?? (profileIdMap[t.assigned_to] ?? "—"),
    })));
    setLoading(false);
  }, [fFilter, profiles]);

  const markDone = async (id: string) => {
    await supabase.from("crm_tasks").update({ status: "Completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const addTask = async () => {
    if (!fTitle) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_tasks").insert({
      created_by: user?.id ?? null,
      title: fTitle, category: fCategory,
      patient_name: fPatient || null,
      assigned_to: profileMap[fAssigned] ?? null,
      assigned_label: fAssigned || null,
      due_date: fDue || null,
      priority: fPriority,
      notes: fNotes || null,
      status: "Pending",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setFTitle(""); setFPatient(""); setFDue(today()); setFNotes(""); setError(null);
    load();
  };

  const pending   = tasks.filter(t => t.status === "Pending").length;
  const overdue   = tasks.filter(t => t.status === "Pending" && t.due_date && t.due_date < today()).length;
  const completed = tasks.filter(t => t.status === "Completed").length;

  return (
    <div>
      <CRMPageHeader title="Task List" rightSlot={
        <PrimaryBtn onClick={() => setModal(true)}><Plus className="h-3.5 w-3.5 inline mr-1" />Add Task</PrimaryBtn>
      } />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPICard label="Total Tasks" value={tasks.length} />
        <KPICard label="Pending"     value={pending}   color="text-amber-600" />
        <KPICard label="Overdue"     value={overdue}   color="text-red-500" />
        <KPICard label="Completed"   value={completed} color="text-green-600" />
      </div>

      <CRMFilterBar onView={load} onReset={() => { setFFilter("All"); setTasks([]); }}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Status</label>
          <select value={fFilter} onChange={e => setFFilter(e.target.value)}
            className="appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 pr-6 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-32">
            {["All","Pending","Completed"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </CRMFilterBar>

      <div className="mt-3">
        <CRMTable loading={loading}
          columns={["Task","Category","Patient","Assigned To","Due Date","Priority","Status","Actions"]}
          rows={tasks.map(t => {
            const isOverdue = t.status === "Pending" && t.due_date && t.due_date < today();
            return [
              <span className="font-medium text-xs max-w-[200px] block truncate">{t.title}</span>,
              <span className="text-[10px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 font-medium">{t.category ?? "—"}</span>,
              t.patient_name ?? "—",
              t.assigned_name,
              <span className={isOverdue ? "text-red-500 font-semibold" : ""}>{fmtDate(t.due_date)}</span>,
              <CRMStatusBadge status={isOverdue ? "Overdue" : t.status} />,
              <CRMStatusBadge status={t.priority} />,
              <div className="flex gap-1">
                {t.status !== "Completed" && (
                  <button onClick={() => markDone(t.id)}
                    className="text-[10px] border border-green-300 text-green-700 rounded px-1.5 py-0.5 hover:bg-green-50">Done</button>
                )}
              </div>,
            ];
          })}
        />
      </div>

      <CRMModal title="Add Task" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput   label="Task Title"   value={fTitle}    onChange={setFTitle}    required className="col-span-2" />
            <CSelect  label="Category"     options={TASK_CATEGORIES} value={fCategory} onChange={setFCategory} />
            <CInput   label="Patient Name" value={fPatient}  onChange={setFPatient} />
            <CSelect  label="Assigned To"  options={["Unassigned", ...profiles.map(p => p.name)]} value={fAssigned} onChange={setFAssigned} />
            <CSelect  label="Priority"     options={PRIORITIES} value={fPriority}   onChange={setFPriority} />
            <CDate    label="Due Date"     value={fDue}      onChange={setFDue} />
            <CTextarea label="Notes"       value={fNotes}    onChange={setFNotes}    className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={addTask}>{saving ? "Saving..." : "Add Task"}</PrimaryBtn>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Recurring Tasks ──────────────────────────────────────────────────────────

export function RecurringTasks() {
  const { user }  = useAuth();
  const profiles  = useProfiles();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fFreq,     setFFreq]     = useState("Weekly");
  const [fAssignee, setFAssignee] = useState("");
  const [fStart,    setFStart]    = useState(today());
  const [fNotes,    setFNotes]    = useState("");

  const profileMap = Object.fromEntries(profiles.map(p => [p.name, p.id]));
  const profileIdMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const computeNextDue = (start: string, freq: string) => {
    if (!start) return null;
    const d = new Date(start);
    switch (freq) {
      case "Daily":       d.setDate(d.getDate() + 1); break;
      case "Weekly":      d.setDate(d.getDate() + 7); break;
      case "Fortnightly": d.setDate(d.getDate() + 14); break;
      case "Monthly":     d.setMonth(d.getMonth() + 1); break;
      case "Quarterly":   d.setMonth(d.getMonth() + 3); break;
      case "Yearly":      d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split("T")[0];
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("recurring_tasks").select("*").order("next_due_date");
    setRows((data ?? []).map((r: any) => ({ ...r, assignee_name: profileIdMap[r.assignee_id] ?? r.assignee_id ?? "—" })));
    setLoading(false);
  }, [profiles]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "Active" ? "Paused" : "Active";
    await supabase.from("recurring_tasks").update({ status: next }).eq("id", id);
    load();
  };

  const save = async () => {
    if (!fName) { setError("Task name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("recurring_tasks").insert({
      created_by:    user?.id ?? null,
      name:          fName,
      frequency:     fFreq,
      assignee_id:   profileMap[fAssignee] ?? null,
      start_date:    fStart,
      next_due_date: computeNextDue(fStart, fFreq),
      notes:         fNotes || null,
      status:        "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setFName(""); setFAssignee(""); setFStart(today()); setFNotes(""); setError(null);
    load();
  };

  return (
    <div>
      <CRMPageHeader title="Recurring Tasks" rightSlot={
        <PrimaryBtn onClick={() => { setModal(true); if (!rows.length) load(); }}><Plus className="h-3.5 w-3.5 inline mr-1" />New Recurring Task</PrimaryBtn>
      } />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard label="Total Recurring" value={rows.length} />
        <KPICard label="Active"          value={rows.filter(t=>t.status==="Active").length}  color="text-green-600" />
        <KPICard label="Paused"          value={rows.filter(t=>t.status==="Paused").length}  color="text-amber-600" />
      </div>

      <div className="mb-3"><PrimaryBtn onClick={load}>{loading ? "Loading..." : "Load Tasks"}</PrimaryBtn></div>

      <CRMTable loading={loading}
        columns={["Task","Frequency","Assignee","Next Due","Status","Actions"]}
        rows={rows.map(t => [
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-xs">{t.name}</span>
          </div>,
          <span className="text-[10px] bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 font-medium">{t.frequency}</span>,
          t.assignee_name,
          fmtDate(t.next_due_date),
          <CRMStatusBadge status={t.status} />,
          <div className="flex gap-1">
            <button onClick={() => toggleStatus(t.id, t.status)}
              className={`text-[10px] border rounded px-1.5 py-0.5 ${t.status === "Active" ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}>
              {t.status === "Active" ? "Pause" : "Resume"}
            </button>
          </div>,
        ])}
      />

      <CRMModal title="New Recurring Task" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Task Name"  value={fName}     onChange={setFName}     required className="col-span-2" />
            <CSelect label="Frequency"  options={FREQ_OPTIONS} value={fFreq}       onChange={setFFreq} />
            <CSelect label="Assignee"   options={["Unassigned", ...profiles.map(p => p.name)]} value={fAssignee} onChange={setFAssignee} />
            <CDate   label="Start Date" value={fStart}    onChange={setFStart}    className="col-span-2" />
            <CTextarea label="Notes"    value={fNotes}    onChange={setFNotes}    className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={save}>{saving ? "Saving..." : "Create"}</PrimaryBtn>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Reminder Center ──────────────────────────────────────────────────────────

export function ReminderCenter() {
  const { user }    = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [fTitle,   setFTitle]   = useState("");
  const [fType,    setFType]    = useState("Appointment");
  const [fChannel, setFChannel] = useState("WhatsApp");
  const [fDate,    setFDate]    = useState(today());
  const [fTime,    setFTime]    = useState("09:00");
  const [fMsg,     setFMsg]     = useState("");

  const REMINDER_TYPES = ["Appointment","Follow-up","Payment","Campaign","Birthday","Other"];
  const CHANNELS       = ["WhatsApp","SMS","Email"];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_reminders").select("*").order("scheduled_at");
    setReminders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markSent = async (id: string) => {
    await supabase.from("crm_reminders").update({ status: "Sent", sent_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const addReminder = async () => {
    if (!fTitle || !fDate) { setError("Title and date are required."); return; }
    setSaving(true); setError(null);
    const scheduledAt = new Date(`${fDate}T${fTime || "09:00"}:00`).toISOString();
    const { error: err } = await supabase.from("crm_reminders").insert({
      created_by: user?.id ?? null,
      title: fTitle, reminder_type: fType,
      channel: fChannel, message: fMsg || null,
      scheduled_at: scheduledAt, status: "Scheduled",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setFTitle(""); setFDate(today()); setFTime("09:00"); setFMsg(""); setError(null);
    load();
  };

  const upcoming = reminders.filter(r => r.status === "Scheduled");
  const scheduled = upcoming.length;
  const sent = reminders.filter(r => r.status === "Sent").length;

  return (
    <div>
      <CRMPageHeader title="Reminder Center" rightSlot={
        <PrimaryBtn onClick={() => setModal(true)}><Bell className="h-3.5 w-3.5 inline mr-1" />Schedule Reminder</PrimaryBtn>
      } />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard label="Total Reminders" value={reminders.length} />
        <KPICard label="Scheduled"       value={scheduled} color="text-blue-600" />
        <KPICard label="Sent"            value={sent}      color="text-green-600" />
      </div>

      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">Upcoming ({upcoming.length})</p>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-700">{r.title}</div>
                    <div className="text-[10px] text-gray-400">{r.channel} · {fmtDate(r.scheduled_at)}</div>
                  </div>
                </div>
                <button onClick={() => markSent(r.id)}
                  className="text-[10px] bg-green-500 text-white rounded px-2 py-0.5 hover:bg-green-600">Send Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <CRMTable loading={loading}
        columns={["Reminder","Type","Channel","Scheduled At","Status","Actions"]}
        rows={reminders.map(r => [
          <span className="font-medium text-xs">{r.title}</span>,
          <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-medium">{r.reminder_type ?? "—"}</span>,
          <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${r.channel==="WhatsApp"?"bg-green-100 text-green-700":r.channel==="SMS"?"bg-blue-100 text-blue-700":"bg-purple-100 text-purple-700"}`}>{r.channel}</span>,
          fmtDate(r.scheduled_at),
          <CRMStatusBadge status={r.status} />,
          <div className="flex gap-1">
            {r.status === "Scheduled" && (
              <button onClick={() => markSent(r.id)}
                className="text-[10px] border border-green-300 text-green-700 rounded px-1.5 py-0.5 hover:bg-green-50">Send</button>
            )}
          </div>,
        ])}
      />

      <CRMModal title="Schedule Reminder" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Title / Subject" value={fTitle}   onChange={setFTitle}   required className="col-span-2" />
            <CSelect label="Type"            options={REMINDER_TYPES} value={fType}  onChange={setFType} />
            <CSelect label="Channel"         options={CHANNELS}       value={fChannel} onChange={setFChannel} />
            <CDate   label="Date"            value={fDate}    onChange={setFDate} />
            <CInput  label="Time"            value={fTime}    onChange={setFTime}    type="time" />
            <CTextarea label="Message"       value={fMsg}     onChange={setFMsg}     className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={addReminder}>{saving ? "Saving..." : "Schedule"}</PrimaryBtn>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}
