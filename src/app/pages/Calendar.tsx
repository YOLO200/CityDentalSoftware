import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  ChevronLeft, ChevronRight, Plus, X, Search, RotateCcw, Edit2,
  CalendarDays, User2, Building2, Clock, Stethoscope, Phone, AlignLeft,
  CheckSquare,
} from "lucide-react";
import { ChevronDown as CDown } from "lucide-react";
import { toast } from "sonner";

import type {
  Appointment, AppointmentStatus, Task, TaskStatus, DoctorUnavailability,
  CalendarSettings, ViewMode,
} from "./calendar/types";
import {
  DOCTORS, ALL_STATUSES, CANCEL_REASONS, DURATIONS,
  INITIAL_APPOINTMENTS, INITIAL_TASKS, INITIAL_UNAVAILABILITY,
} from "./calendar/mockData";
import { NewModal } from "./calendar/NewModal";

// ── Date helpers ──────────────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d); date.setDate(date.getDate() + n); return date;
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtShort(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<AppointmentStatus, { color: string; bg: string }> = {
  "Scheduled":    { color: "text-blue-700",   bg: "bg-blue-100"   },
  "Confirmed":    { color: "text-green-700",  bg: "bg-green-100"  },
  "Arrived":      { color: "text-teal-700",   bg: "bg-teal-100"   },
  "In Waiting":   { color: "text-amber-700",  bg: "bg-amber-100"  },
  "In Treatment": { color: "text-purple-700", bg: "bg-purple-100" },
  "Completed":    { color: "text-sky-700",    bg: "bg-sky-100"    },
  "Cancelled":    { color: "text-red-600",    bg: "bg-red-100"    },
  "No-show":      { color: "text-rose-700",   bg: "bg-rose-100"   },
  "Rescheduled":  { color: "text-orange-700", bg: "bg-orange-100" },
};

const TASK_STATUS_CFG: Record<TaskStatus, { color: string; bg: string }> = {
  "New":         { color: "text-blue-700",   bg: "bg-blue-100"   },
  "In Progress": { color: "text-amber-700",  bg: "bg-amber-100"  },
  "Completed":   { color: "text-green-700",  bg: "bg-green-100"  },
  "Cancelled":   { color: "text-red-600",    bg: "bg-red-100"    },
};

// ── Time slot config ──────────────────────────────────────────────────────────
const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const t = 8 * 60 + i * 30;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
});

// ── Positioning helpers ───────────────────────────────────────────────────────
function getPos(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return {
    top:    ((sh * 60 + sm - 8 * 60) / 30) * 48,
    height: Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 30 * 48, 24),
  };
}
function durFromTimes(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return DURATIONS.find(d => d.mins === (eh * 60 + em) - (sh * 60 + sm))?.label ?? "30 min";
}
function endFromDur(start: string, dur: string): string {
  const [h, m] = start.split(":").map(Number);
  const mins = DURATIONS.find(d => d.label === dur)?.mins ?? 30;
  const e = h * 60 + m + mins;
  return `${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
}

// ── Simple form primitives (Cancel / Reschedule modals) ───────────────────────
function FLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-gray-500 mb-1">{children}</div>;
}
function FInput({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <FLabel>{label}</FLabel>}
      <input {...props} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white ${className}`} />
    </div>
  );
}
function FSelect({ label, options, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      {label && <FLabel>{label}</FLabel>}
      <div className="relative">
        <select {...props} className={`w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm outline-none focus:border-indigo-400 bg-white ${className}`}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <CDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
function FTextarea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <FLabel>{label}</FLabel>}
      <textarea {...props} rows={props.rows ?? 2} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white resize-none ${className}`} />
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, sm }: { status: AppointmentStatus; sm?: boolean }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${c.bg} ${c.color} ${sm ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs"}`}>
      {status}
    </span>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ apt, onConfirm, onClose }: {
  apt: Appointment;
  onConfirm: (reason: string, notify: boolean) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [notify, setNotify] = useState(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Cancel Appointment?</h3>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{apt.patientName}</span> · {apt.date} at {apt.startTime}
        </p>
        <div className="space-y-4">
          <FSelect label="Cancellation Reason" value={reason} onChange={e => setReason(e.target.value)}
            options={CANCEL_REASONS.map(r => ({ value: r, label: r }))} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="rounded" />
            Notify patient via SMS / Email
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Go Back</button>
          <button onClick={() => onConfirm(reason, notify)} className="px-4 py-2 bg-red-600 rounded-lg text-sm text-white hover:bg-red-700">
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────
function RescheduleModal({ apt, onConfirm, onClose }: {
  apt: Appointment;
  onConfirm: (date: string, time: string, reason: string, notify: boolean) => void;
  onClose: () => void;
}) {
  const [date,   setDate]   = useState(apt.date);
  const [time,   setTime]   = useState(apt.startTime);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [error,  setError]  = useState("");

  const submit = () => {
    if (!date || !time) { setError("New date and time are required."); return; }
    onConfirm(date, time, reason, notify);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Reschedule Appointment</h3>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{apt.patientName}</span> — currently {apt.date} at {apt.startTime}
        </p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FInput label="New Date *" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <FInput label="New Time *" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <FTextarea label="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this being rescheduled?" rows={2} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="rounded" />
            Notify patient via SMS / Email
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} className="px-4 py-2 bg-[#1e2d5a] rounded-lg text-sm text-white hover:bg-[#1a2650]">
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Row (shared by SidePanel) ─────────────────────────────────────────
function DetailRow({ icon, label, value, valueStyle }: { icon: React.ReactNode; label: string; value: string; valueStyle?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-400 leading-none mb-0.5">{label}</div>
        <div className={`text-xs font-medium break-words ${valueStyle ?? "text-gray-700"}`}>{value}</div>
      </div>
    </div>
  );
}

// ── Side Panel (Appointment + Task + Unavailability) ──────────────────────────
type SelectedItem =
  | { kind: "appointment";   data: Appointment          }
  | { kind: "task";          data: Task                 }
  | { kind: "unavailability";data: DoctorUnavailability };

function SidePanel({ item, onClose, onQuickStatus, onEdit, onCancel, onReschedule, onEditTask, onDeleteTask, onDeleteUnavail }: {
  item: SelectedItem;
  onClose: () => void;
  onQuickStatus: (status: AppointmentStatus) => void;
  onEdit: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
  onDeleteUnavail: () => void;
}) {
  if (item.kind === "appointment") {
    const apt = item.data;
    const isDone = ["Completed", "Cancelled", "No-show"].includes(apt.status);
    const dur = durFromTimes(apt.startTime, apt.endTime);

    const quickActions: { label: string; status: AppointmentStatus; cls: string }[] = [];
    if (apt.status === "Scheduled" || apt.status === "Confirmed")
      quickActions.push({ label: "✓ Mark Arrived",    status: "Arrived",      cls: "bg-teal-600 hover:bg-teal-700 text-white" });
    if (apt.status === "Arrived" || apt.status === "In Waiting")
      quickActions.push({ label: "▶ Start Treatment", status: "In Treatment", cls: "bg-purple-600 hover:bg-purple-700 text-white" });
    if (apt.status === "In Treatment")
      quickActions.push({ label: "✓ Mark Completed",  status: "Completed",    cls: "bg-sky-600 hover:bg-sky-700 text-white" });
    if (!isDone)
      quickActions.push({ label: "✗ Mark No-show",    status: "No-show",      cls: "border border-rose-200 text-rose-600 hover:bg-rose-50" });

    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: apt.doctorColor }} />
            <span className="font-semibold text-sm text-gray-900 truncate">{apt.patientName}</span>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-2"><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
            <StatusBadge status={apt.status} />
            {apt.isNewPatient && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">New Patient</span>}
            {apt.isWalkIn && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium border border-orange-100">Walk-In</span>}
            {apt.appointmentType === "Group" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100">Group</span>}
            {apt.appointmentType === "Series" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-medium border border-cyan-100">Series</span>}
            {apt.hasPendingPayment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-100">₹ Payment Pending</span>}
          </div>

          <div className="px-4 py-2 space-y-3 border-b border-gray-100">
            <DetailRow icon={<User2 className="h-3.5 w-3.5" />}        label="Patient"   value={`${apt.patientName} · ${apt.patientId}`} />
            {apt.patientPhone && <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Mobile" value={apt.patientPhone} />}
            <DetailRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date"      value={apt.date} />
            <DetailRow icon={<Clock className="h-3.5 w-3.5" />}        label="Time"      value={`${apt.startTime} – ${apt.endTime}  (${dur})`} />
            <DetailRow icon={<User2 className="h-3.5 w-3.5" />}        label="Doctor"    value={apt.doctor} />
            <DetailRow icon={<Building2 className="h-3.5 w-3.5" />}    label="Center"    value={apt.center} />
            <DetailRow icon={<Stethoscope className="h-3.5 w-3.5" />}  label="Treatment" value={`${apt.treatment}  ·  ${apt.treatmentCategory}`} />
            {apt.groupTitle && <DetailRow icon={<User2 className="h-3.5 w-3.5" />} label="Group" value={`${apt.groupTitle} (${apt.groupPatients?.length ?? 0} patients)`} />}
            {apt.notes && <DetailRow icon={<AlignLeft className="h-3.5 w-3.5" />} label="Notes" value={apt.notes} />}
            {apt.cancelReason && <DetailRow icon={<X className="h-3.5 w-3.5" />} label="Cancellation Reason" value={apt.cancelReason} valueStyle="text-red-600" />}
            {apt.rescheduleReason && <DetailRow icon={<RotateCcw className="h-3.5 w-3.5" />} label="Reschedule Reason" value={apt.rescheduleReason} valueStyle="text-amber-700" />}
          </div>

          {quickActions.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Quick Actions</div>
              <div className="space-y-1.5">
                {quickActions.map(a => (
                  <button key={a.status} onClick={() => onQuickStatus(a.status)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${a.cls}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isDone && (
            <div className="px-4 py-3 text-xs text-center text-gray-400">
              This appointment is <span className="font-medium">{apt.status.toLowerCase()}</span>.
            </div>
          )}
        </div>

        {!isDone && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2 flex-shrink-0">
            <button onClick={onEdit}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#1e2d5a] text-white hover:bg-[#1a2650] transition-colors flex items-center justify-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit Appointment
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onReschedule}
                className="py-2 px-3 rounded-lg text-xs font-medium border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1">
                <RotateCcw className="h-3 w-3" /> Reschedule
              </button>
              <button onClick={onCancel}
                className="py-2 px-3 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                Cancel Appt
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (item.kind === "task") {
    const task = item.data;
    const cfg = TASK_STATUS_CFG[task.status];
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: task.color ?? "#6366F1" }} />
            <span className="font-semibold text-sm text-gray-900 truncate">{task.name}</span>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-2"><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center rounded-full font-medium px-2.5 py-1 text-xs ${cfg.bg} ${cfg.color}`}>{task.status}</span>
            {task.allDay && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">All Day</span>}
            {task.isRecurring && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Recurring</span>}
            {task.disallowAppointments && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Blocks Appts</span>}
          </div>

          <div className="px-4 py-2 space-y-3">
            <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Center" value={task.center} />
            {task.date && <DetailRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date" value={task.date} />}
            {task.startTime && task.endTime && (
              <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={`${task.startTime} – ${task.endTime}`} />
            )}
            {task.assignedTo && <DetailRow icon={<User2 className="h-3.5 w-3.5" />} label="Assigned To" value={task.assignedTo} />}
            {task.patientName && <DetailRow icon={<User2 className="h-3.5 w-3.5" />} label="Patient" value={task.patientName} />}
            {task.project && <DetailRow icon={<AlignLeft className="h-3.5 w-3.5" />} label="Project" value={task.project} />}
            {task.dueDate && <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Due" value={`${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ""}`} />}
            {task.notes && <DetailRow icon={<AlignLeft className="h-3.5 w-3.5" />} label="Notes" value={task.notes} />}
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3 space-y-2 flex-shrink-0">
          <button onClick={onEditTask} className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#1e2d5a] text-white hover:bg-[#1a2650] flex items-center justify-center gap-1.5">
            <Edit2 className="h-3.5 w-3.5" /> Edit Task
          </button>
          <button onClick={onDeleteTask} className="w-full py-2 px-3 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
            Delete Task
          </button>
        </div>
      </div>
    );
  }

  // Unavailability
  const unavail = item.data;
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <span className="font-semibold text-sm text-gray-900">Doctor Unavailable</span>
        <button onClick={onClose} className="flex-shrink-0 ml-2"><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <span className="inline-flex items-center rounded-full font-medium px-2.5 py-1 text-xs bg-red-100 text-red-600">{unavail.reason}</span>
        <DetailRow icon={<User2 className="h-3.5 w-3.5" />}        label="Doctor(s)"  value={unavail.doctors.join(", ")} />
        <DetailRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="From"       value={`${unavail.fromDate} at ${unavail.fromTime}`} />
        <DetailRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="To"         value={`${unavail.toDate} at ${unavail.toTime}`} />
        {unavail.description && <DetailRow icon={<AlignLeft className="h-3.5 w-3.5" />} label="Description" value={unavail.description} />}
      </div>
      <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <button onClick={onDeleteUnavail} className="w-full py-2 px-3 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
          Delete Block
        </button>
      </div>
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function AptCard({ apt, compact, onClick }: { apt: Appointment; compact?: boolean; onClick: () => void }) {
  const { top, height } = getPos(apt.startTime, apt.endTime);
  const cfg = STATUS_CFG[apt.status];
  const faded = apt.status === "Cancelled" || apt.status === "No-show";
  const isGroup = apt.appointmentType === "Group";
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      className={`absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer z-10 shadow-sm hover:shadow-md transition-all border-l-[3px] ${faded ? "opacity-50" : ""}`}
      style={{ top, height, backgroundColor: apt.doctorColor + "18", borderLeftColor: apt.doctorColor }}>
      <div className="p-1.5 h-full flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
            {isGroup ? `👥 ${apt.groupTitle ?? apt.patientName}` : apt.patientName}
          </div>
          {!compact && <div className="text-[10px] text-gray-500 truncate">{apt.treatment}</div>}
          <div className="text-[10px] text-gray-500">{apt.startTime}–{apt.endTime}</div>
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{apt.status}</span>
          {apt.isNewPatient && <span className="text-[9px] px-1 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">New</span>}
          {apt.isWalkIn && <span className="text-[9px] px-1 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium">Walk-In</span>}
          {apt.hasPendingPayment && <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">₹</span>}
          {apt.notes && <span className="text-[9px] text-gray-400">📝</span>}
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  if (!task.startTime || !task.endTime) return null;
  const { top, height } = getPos(task.startTime, task.endTime);
  const color = task.color ?? "#6366F1";
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer z-10 shadow-sm hover:shadow-md transition-all border-l-[3px]"
      style={{ top, height, backgroundColor: color + "18", borderLeftColor: color }}>
      <div className="p-1.5 h-full flex flex-col justify-between">
        <div className="text-[11px] font-semibold truncate leading-tight" style={{ color }}>
          📋 {task.name}
        </div>
        <div className="text-[10px] text-gray-500">{task.startTime}–{task.endTime}</div>
        <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium inline-block w-fit ${TASK_STATUS_CFG[task.status].bg} ${TASK_STATUS_CFG[task.status].color}`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}

// ── Unavailability Card ───────────────────────────────────────────────────────
function UnavailCard({ block, onClick }: { block: DoctorUnavailability; onClick: () => void }) {
  const { top, height } = getPos(block.fromTime, block.toTime);
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      className="absolute left-0 right-0 cursor-pointer z-[5] hover:opacity-80 transition-opacity"
      style={{ top, height, background: "repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 4px,#e2e8f0 4px,#e2e8f0 8px)", borderLeft: "3px solid #94a3b8" }}>
      <div className="px-1.5 py-1">
        <div className="text-[10px] font-medium text-slate-500 truncate">🚫 {block.reason}</div>
        <div className="text-[9px] text-slate-400 truncate">{block.doctors.join(", ")}</div>
      </div>
    </div>
  );
}

// ── Time Labels ───────────────────────────────────────────────────────────────
function TimeLabels() {
  return (
    <div>
      {timeSlots.map((t, i) => (
        <div key={t} className="h-12 border-b border-border px-2 py-2 text-[10px] text-muted-foreground text-right select-none">
          {i % 2 === 0 ? t : ""}
        </div>
      ))}
    </div>
  );
}

// ── Day Column ────────────────────────────────────────────────────────────────
function DayColumn({ ymd, appointments, tasks, unavailabilities, doctorFilter, isToday, onCellClick, onAptClick, onTaskClick, onUnavailClick }: {
  ymd: string;
  appointments: Appointment[];
  tasks: Task[];
  unavailabilities: DoctorUnavailability[];
  doctorFilter?: string;
  isToday: boolean;
  onCellClick: () => void;
  onAptClick: (apt: Appointment) => void;
  onTaskClick: (task: Task) => void;
  onUnavailClick: (block: DoctorUnavailability) => void;
}) {
  const dayApts = appointments.filter(a => a.date === ymd);
  const dayTasks = tasks.filter(t => t.date === ymd && !t.allDay && !!t.startTime && !!t.endTime);
  const dayUnavail = unavailabilities.filter(u =>
    u.fromDate <= ymd && u.toDate >= ymd &&
    (!doctorFilter || u.doctors.includes(doctorFilter))
  );

  return (
    <div className={`relative border-l border-border ${isToday ? "bg-orange-50/30" : ""}`}>
      {timeSlots.map(t => (
        <div key={t} className="h-12 border-b border-border cursor-pointer hover:bg-primary/5 transition-colors" onClick={onCellClick} />
      ))}
      {dayUnavail.map(u => <UnavailCard key={u.id} block={u} onClick={() => onUnavailClick(u)} />)}
      {dayApts.map(apt => <AptCard key={apt.id} apt={apt} compact onClick={() => onAptClick(apt)} />)}
      {dayTasks.map(task => <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)}
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ weekDays, appointments, tasks, unavailabilities, onCellClick, onAptClick, onTaskClick, onUnavailClick }: {
  weekDays: Date[];
  appointments: Appointment[];
  tasks: Task[];
  unavailabilities: DoctorUnavailability[];
  onCellClick: (date: string) => void;
  onAptClick: (apt: Appointment) => void;
  onTaskClick: (task: Task) => void;
  onUnavailClick: (block: DoctorUnavailability) => void;
}) {
  const today = new Date();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div style={{ minWidth: 640 }}>
        <div className="grid border-b border-border bg-secondary" style={{ gridTemplateColumns: "56px repeat(7,1fr)" }}>
          <div className="p-3" />
          {weekDays.map(day => (
            <div key={toYMD(day)} className="p-2 text-center border-l border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{day.toLocaleDateString("en-GB", { weekday: "short" })}</div>
              <div className={`mt-0.5 text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, today) ? "bg-orange-500 text-white" : ""}`}>
                {day.getDate()}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {appointments.filter(a => a.date === toYMD(day)).length || ""}
              </div>
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7,1fr)" }}>
          <TimeLabels />
          {weekDays.map(day => (
            <DayColumn key={toYMD(day)} ymd={toYMD(day)}
              appointments={appointments} tasks={tasks} unavailabilities={unavailabilities}
              isToday={isSameDay(day, today)}
              onCellClick={() => onCellClick(toYMD(day))}
              onAptClick={onAptClick} onTaskClick={onTaskClick} onUnavailClick={onUnavailClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ date, appointments, tasks, unavailabilities, onAptClick, onTaskClick, onUnavailClick }: {
  date: Date;
  appointments: Appointment[];
  tasks: Task[];
  unavailabilities: DoctorUnavailability[];
  onAptClick: (apt: Appointment) => void;
  onTaskClick: (task: Task) => void;
  onUnavailClick: (block: DoctorUnavailability) => void;
}) {
  const today   = new Date();
  const isToday = isSameDay(date, today);
  const dayApts = appointments.filter(a => a.date === toYMD(date));
  const dayTasks = tasks.filter(t => t.date === toYMD(date) && !t.allDay);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div style={{ minWidth: 320 }}>
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px 1fr" }}>
          <div className="bg-secondary" />
          <div className={`p-3 text-center border-l border-border ${isToday ? "bg-orange-50" : "bg-secondary"}`}>
            <div className="text-xs text-muted-foreground">{date.toLocaleDateString("en-GB", { weekday: "long" })}</div>
            <div className={`text-xl font-bold mt-0.5 ${isToday ? "text-orange-500" : ""}`}>
              {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {dayApts.length} appointment{dayApts.length !== 1 ? "s" : ""}
              {dayTasks.length > 0 ? ` · ${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""}` : ""}
            </div>
          </div>
        </div>
        {dayApts.length === 0 && dayTasks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No appointments for this day.</div>
        )}
        <div className="grid" style={{ gridTemplateColumns: "56px 1fr" }}>
          <TimeLabels />
          <DayColumn ymd={toYMD(date)} appointments={appointments} tasks={tasks} unavailabilities={unavailabilities}
            isToday={isToday} onCellClick={() => {}}
            onAptClick={onAptClick} onTaskClick={onTaskClick} onUnavailClick={onUnavailClick} />
        </div>
      </div>
    </div>
  );
}

// ── Doctor View ───────────────────────────────────────────────────────────────
function DoctorView({ date, appointments, tasks, unavailabilities, visibleDoctors, onAptClick, onTaskClick, onUnavailClick, onCellClick }: {
  date: Date;
  appointments: Appointment[];
  tasks: Task[];
  unavailabilities: DoctorUnavailability[];
  visibleDoctors: string[];
  onAptClick: (apt: Appointment) => void;
  onTaskClick: (task: Task) => void;
  onUnavailClick: (block: DoctorUnavailability) => void;
  onCellClick: (date: string, doctor: string) => void;
}) {
  const today = new Date();
  const ymd   = toYMD(date);
  const cols  = DOCTORS.filter(d => visibleDoctors.includes(d.name));

  if (!cols.length) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No doctors selected.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div style={{ minWidth: cols.length * 150 + 56 }}>
        <div className="grid border-b border-border bg-secondary" style={{ gridTemplateColumns: `56px repeat(${cols.length},1fr)` }}>
          <div className="p-3 text-center">
            <div className="text-[10px] text-muted-foreground">{date.toLocaleDateString("en-GB", { weekday: "short" })}</div>
            <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-0.5 ${isSameDay(date, today) ? "bg-orange-500 text-white" : ""}`}>
              {date.getDate()}
            </div>
          </div>
          {cols.map(doc => (
            <div key={doc.name} className="p-2 text-center border-l border-border">
              <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: doc.color }} />
              <div className="text-[10px] font-semibold text-foreground leading-tight">{doc.name}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {appointments.filter(a => a.date === ymd && a.doctor === doc.name).length} appts
              </div>
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${cols.length},1fr)` }}>
          <TimeLabels />
          {cols.map(doc => (
            <DayColumn key={doc.name} ymd={ymd}
              appointments={appointments.filter(a => a.doctor === doc.name)}
              tasks={tasks}
              unavailabilities={unavailabilities}
              doctorFilter={doc.name}
              isToday={isSameDay(date, today)}
              onCellClick={() => onCellClick(ymd, doc.name)}
              onAptClick={onAptClick} onTaskClick={onTaskClick} onUnavailClick={onUnavailClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({ baseDate, appointments, tasks, onDayClick }: {
  baseDate: Date;
  appointments: Appointment[];
  tasks: Task[];
  onDayClick: (day: Date) => void;
}) {
  const year  = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const today = new Date();
  const first = new Date(year, month, 1);
  const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1;
    return n < 1 || n > daysInMonth ? null : new Date(year, month, n);
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border bg-secondary">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-24 border-b border-r border-border bg-gray-50/40" />;
          const ymd = toYMD(day);
          const dayApts = appointments.filter(a => a.date === ymd);
          const dayTasks = tasks.filter(t => t.date === ymd && t.showOnCalendar);
          const isToday = isSameDay(day, today);
          return (
            <div key={ymd}
              className={`h-24 border-b border-r border-border p-1.5 cursor-pointer hover:bg-primary/5 transition-colors ${isToday ? "bg-orange-50" : ""}`}
              onClick={() => onDayClick(day)}>
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-orange-500 text-white" : "text-foreground"}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {[...dayApts.slice(0, 2).map(apt => (
                  <div key={`a-${apt.id}`} className="text-[9px] truncate rounded px-1 py-0.5 font-medium"
                    style={{ backgroundColor: apt.doctorColor + "20", color: apt.doctorColor }}>
                    {apt.startTime} {apt.patientName}
                  </div>
                )), ...dayTasks.slice(0, 1).map(t => (
                  <div key={`t-${t.id}`} className="text-[9px] truncate rounded px-1 py-0.5 font-medium"
                    style={{ backgroundColor: (t.color ?? "#6366F1") + "20", color: t.color ?? "#6366F1" }}>
                    📋 {t.name}
                  </div>
                ))]}
                {(dayApts.length + dayTasks.length) > 3 && (
                  <div className="text-[9px] text-muted-foreground pl-1">+{dayApts.length + dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar Page ─────────────────────────────────────────────────────────────
export function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [baseDate,          setBaseDate]          = useState(new Date());
  const [viewMode,          setViewMode]          = useState<ViewMode>("week");
  const [appointments,      setAppointments]      = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [tasks,             setTasks]             = useState<Task[]>(INITIAL_TASKS);
  const [unavailabilities,  setUnavailabilities]  = useState<DoctorUnavailability[]>(INITIAL_UNAVAILABILITY);
  const [calendarSettings,  setCalendarSettings]  = useState<CalendarSettings>({ showTasksOnCalendar: true, taskColor: "#6366F1", taskVisibility: "all" });
  const [selectedItem,      setSelectedItem]      = useState<SelectedItem | undefined>();
  const [showNewModal,      setShowNewModal]      = useState(false);
  const [showCancel,        setShowCancel]        = useState(false);
  const [showReschedule,    setShowReschedule]    = useState(false);
  const [newModalDate,      setNewModalDate]      = useState<string | undefined>();
  const [newModalDoctor,    setNewModalDoctor]    = useState<string | undefined>();
  const [visibleDoctors,    setVisibleDoctors]    = useState<string[]>(DOCTORS.map(d => d.name));
  const [statusFilter,      setStatusFilter]      = useState<AppointmentStatus | "All">("All");
  const [search,            setSearch]            = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("newModal") === "1") {
      setShowNewModal(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const weekStart = useMemo(() => getMonday(baseDate), [baseDate.toDateString()]);
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart.toDateString()]);

  const navigate = (dir: number) => {
    if (viewMode === "day" || viewMode === "doctor") setBaseDate(d => addDays(d, dir));
    else if (viewMode === "week") setBaseDate(d => addDays(d, dir * 7));
    else setBaseDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + dir); return n; });
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "day" || viewMode === "doctor") return fmtShort(baseDate);
    if (viewMode === "week") return `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}`;
    return fmtMonthYear(baseDate);
  }, [viewMode, baseDate.toDateString()]);

  const filteredApts = useMemo(() =>
    appointments.filter(a =>
      visibleDoctors.includes(a.doctor) &&
      (statusFilter === "All" || a.status === statusFilter) &&
      (!search.trim() ||
        a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.patientId.toLowerCase().includes(search.toLowerCase()) ||
        a.patientPhone.includes(search) ||
        a.doctor.toLowerCase().includes(search.toLowerCase()) ||
        a.treatment.toLowerCase().includes(search.toLowerCase()))
    ),
    [appointments, visibleDoctors, statusFilter, search]
  );

  const visibleTasks = useMemo(() =>
    calendarSettings.showTasksOnCalendar
      ? tasks.filter(t => t.showOnCalendar &&
          (!calendarSettings.filterProject || t.project === calendarSettings.filterProject) &&
          (!calendarSettings.filterAssignedUser || t.assignedTo === calendarSettings.filterAssignedUser))
      : [],
    [tasks, calendarSettings]
  );

  // ── Appointment actions ───────────────────────────────────────────────────
  const updateApt = (updated: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (selectedItem?.kind === "appointment" && selectedItem.data.id === updated.id)
      setSelectedItem({ kind: "appointment", data: updated });
  };

  const handleSaveAppointments = useCallback((apts: Appointment[]) => {
    setAppointments(prev => [...prev, ...apts]);
    setShowNewModal(false);
  }, []);

  const handleSaveTasks = useCallback((newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    setShowNewModal(false);
  }, []);

  const handleSaveUnavailability = useCallback((blocks: DoctorUnavailability[]) => {
    setUnavailabilities(prev => [...prev, ...blocks]);
    setShowNewModal(false);
  }, []);

  const handleUpdateCalendarSettings = useCallback((s: Partial<CalendarSettings>) => {
    setCalendarSettings(prev => ({ ...prev, ...s }));
    setShowNewModal(false);
  }, []);

  const handleQuickStatus = (status: AppointmentStatus) => {
    if (selectedItem?.kind !== "appointment") return;
    const updated = { ...selectedItem.data, status };
    updateApt(updated);
    toast.success(`Marked as ${status}`, { description: selectedItem.data.patientName });
  };

  const handleCancel = (reason: string, notify: boolean) => {
    if (selectedItem?.kind !== "appointment") return;
    const updated = { ...selectedItem.data, status: "Cancelled" as AppointmentStatus, cancelReason: reason };
    updateApt(updated);
    setShowCancel(false);
    toast.error("Appointment cancelled", {
      description: `${selectedItem.data.patientName}${notify ? " · Patient notified" : ""}`,
    });
  };

  const handleReschedule = (date: string, time: string, reason: string, notify: boolean) => {
    if (selectedItem?.kind !== "appointment") return;
    const apt = selectedItem.data;
    const dur     = durFromTimes(apt.startTime, apt.endTime);
    const endTime = endFromDur(time, dur);
    const updated = { ...apt, date, startTime: time, endTime, status: "Rescheduled" as AppointmentStatus, rescheduleReason: reason || undefined };
    updateApt(updated);
    setShowReschedule(false);
    toast.success("Appointment rescheduled", {
      description: `${apt.patientName} → ${date} at ${time}${notify ? " · Patient notified" : ""}`,
    });
  };

  const openNew = (date?: string, doctor?: string) => {
    setNewModalDate(date);
    setNewModalDoctor(doctor);
    setShowNewModal(true);
  };

  const VIEW_MODES: { id: ViewMode; label: string }[] = [
    { id: "day",    label: "Day"       },
    { id: "week",   label: "Week"      },
    { id: "month",  label: "Month"     },
    { id: "doctor", label: "By Doctor" },
  ];

  const calendarEventHandlers = {
    onAptClick:    (apt: Appointment)          => setSelectedItem({ kind: "appointment",    data: apt }),
    onTaskClick:   (task: Task)                => setSelectedItem({ kind: "task",           data: task }),
    onUnavailClick:(block: DoctorUnavailability) => setSelectedItem({ kind: "unavailability", data: block }),
  };

  const sidePanelOpen = !!selectedItem;

  return (
    <>
      <div className={`flex h-screen flex-col bg-background p-4 gap-3 transition-[margin] duration-200 ${sidePanelOpen ? "mr-80" : ""}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-foreground">Appointments</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patient, mobile, treatment..."
                className="w-56 rounded-xl border border-border bg-card py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as AppointmentStatus | "All")}
                className="appearance-none rounded-xl border border-border bg-card pl-3 pr-7 py-2 text-sm focus:outline-none">
                <option value="All">All Statuses</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <CDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <button onClick={() => openNew(toYMD(baseDate))}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-border bg-card px-3 py-2 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setBaseDate(new Date())}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary">
              Today
            </button>
            <div className="relative">
              <button onClick={() => dateInputRef.current?.showPicker?.()}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-secondary min-w-[220px] text-left font-medium">
                {headerLabel}
              </button>
              <input ref={dateInputRef} type="date" value={toYMD(baseDate)}
                onChange={e => e.target.value && setBaseDate(new Date(e.target.value + "T00:00:00"))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full pointer-events-none" tabIndex={-1} />
            </div>
            <button onClick={() => navigate(1)} className="rounded-xl border border-border bg-card px-3 py-2 hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {VIEW_MODES.map(m => (
              <button key={m.id} onClick={() => setViewMode(m.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === m.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Doctor legend ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Doctors:</span>
          {DOCTORS.map(doc => (
            <button key={doc.name}
              onClick={() => setVisibleDoctors(prev => prev.includes(doc.name) ? prev.filter(d => d !== doc.name) : [...prev, doc.name])}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${visibleDoctors.includes(doc.name) ? "bg-secondary" : "opacity-40 hover:opacity-60"}`}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: doc.color }} />
              {doc.name}
            </button>
          ))}
          {calendarSettings.showTasksOnCalendar && tasks.some(t => t.showOnCalendar) && (
            <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs bg-secondary/60">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendarSettings.taskColor }} />
              Tasks
            </span>
          )}
          {filteredApts.length === 0 && search && (
            <span className="text-xs text-muted-foreground ml-2 italic">No appointments match the current filters.</span>
          )}
        </div>

        {/* ── Calendar Views ── */}
        {viewMode === "week" && (
          <WeekView weekDays={weekDays} appointments={filteredApts}
            tasks={visibleTasks} unavailabilities={unavailabilities}
            onCellClick={date => openNew(date)} {...calendarEventHandlers} />
        )}
        {viewMode === "day" && (
          <DayView date={baseDate} appointments={filteredApts}
            tasks={visibleTasks} unavailabilities={unavailabilities}
            {...calendarEventHandlers} />
        )}
        {viewMode === "month" && (
          <MonthView baseDate={baseDate} appointments={filteredApts} tasks={visibleTasks}
            onDayClick={d => { setBaseDate(d); setViewMode("day"); }} />
        )}
        {viewMode === "doctor" && (
          <DoctorView date={baseDate} appointments={filteredApts}
            tasks={visibleTasks} unavailabilities={unavailabilities}
            visibleDoctors={visibleDoctors}
            onCellClick={(date, doctor) => openNew(date, doctor)}
            {...calendarEventHandlers} />
        )}
      </div>

      {/* ── Side Panel ── */}
      {selectedItem && (
        <SidePanel
          item={selectedItem}
          onClose={() => setSelectedItem(undefined)}
          onQuickStatus={handleQuickStatus}
          onEdit={() => {
            if (selectedItem.kind === "appointment") {
              setNewModalDate(selectedItem.data.date);
              setSelectedItem(undefined);
              setShowNewModal(true);
            }
          }}
          onCancel={() => setShowCancel(true)}
          onReschedule={() => setShowReschedule(true)}
          onEditTask={() => toast.info("Edit task — coming soon")}
          onDeleteTask={() => {
            if (selectedItem.kind === "task") {
              setTasks(prev => prev.filter(t => t.id !== selectedItem.data.id));
              setSelectedItem(undefined);
              toast.success("Task deleted");
            }
          }}
          onDeleteUnavail={() => {
            if (selectedItem.kind === "unavailability") {
              setUnavailabilities(prev => prev.filter(u => u.id !== selectedItem.data.id));
              setSelectedItem(undefined);
              toast.success("Unavailability block removed");
            }
          }}
        />
      )}

      {/* ── New Modal ── */}
      {showNewModal && (
        <NewModal
          onClose={() => setShowNewModal(false)}
          onSaveAppointments={handleSaveAppointments}
          onSaveTasks={handleSaveTasks}
          onSaveUnavailability={handleSaveUnavailability}
          onUpdateCalendarSettings={handleUpdateCalendarSettings}
          existingAppointments={appointments}
          existingUnavailability={unavailabilities}
          defaultDate={newModalDate}
          defaultDoctor={newModalDoctor}
          calendarSettings={calendarSettings}
        />
      )}

      {/* ── Cancel / Reschedule modals ── */}
      {showCancel && selectedItem?.kind === "appointment" && (
        <CancelModal apt={selectedItem.data} onConfirm={handleCancel} onClose={() => setShowCancel(false)} />
      )}
      {showReschedule && selectedItem?.kind === "appointment" && (
        <RescheduleModal apt={selectedItem.data} onConfirm={handleReschedule} onClose={() => setShowReschedule(false)} />
      )}
    </>
  );
}
