import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, UserPlus, ChevronDown as CDown } from "lucide-react";
import { toast } from "sonner";

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Form primitives ───────────────────────────────────────────────────────────

function FInput({ label, required, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  return (
    <div className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors ${className}`}>
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
      <input className={`w-full ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 text-sm outline-none bg-transparent`} {...props} />
    </div>
  );
}

function FSelect({ label, required, options, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <div className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors ${className}`}>
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none z-10">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
      <select className={`w-full appearance-none ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 pr-8 text-sm outline-none bg-transparent`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <CDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Types & constants ─────────────────────────────────────────────────────────

type TopTab = "appointment" | "task" | "unavailable";
type ApptSubTab = "single" | "series" | "group";

interface Appointment {
  id: number;
  patientName: string;
  treatment: string;
  doctor: string;
  doctorColor: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  date: string;      // YYYY-MM-DD
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

const doctors = [
  { name: "Dr. Anand Jasani",   color: "#3B82F6" },
  { name: "Dr. Priya Patel",    color: "#10B981" },
  { name: "Dr. Michael Foster", color: "#8B5CF6" },
  { name: "Dr. Sarah Lee",      color: "#F59E0B" },
];

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const total = 8 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

// Sample appointments anchored to the current week so they appear on load
const _mon = getMonday(new Date());
const initialAppointments: Appointment[] = [
  { id: 1, patientName: "Rajesh Kumar",  treatment: "Dental Cleaning",   doctor: "Dr. Anand Jasani",   doctorColor: "#3B82F6", startTime: "09:00", endTime: "09:30", date: toYMD(_mon),            status: "Confirmed" },
  { id: 2, patientName: "Priya Sharma",  treatment: "Root Canal",        doctor: "Dr. Michael Foster", doctorColor: "#8B5CF6", startTime: "10:00", endTime: "11:00", date: toYMD(_mon),            status: "Confirmed" },
  { id: 3, patientName: "Amit Singh",    treatment: "Checkup",           doctor: "Dr. Priya Patel",    doctorColor: "#10B981", startTime: "13:00", endTime: "13:30", date: toYMD(addDays(_mon, 1)), status: "Confirmed" },
  { id: 4, patientName: "Neha Gupta",    treatment: "Invisalign Review", doctor: "Dr. Sarah Lee",      doctorColor: "#F59E0B", startTime: "15:30", endTime: "16:00", date: toYMD(addDays(_mon, 1)), status: "Pending"   },
  { id: 5, patientName: "Vikram Reddy",  treatment: "Teeth Whitening",   doctor: "Dr. Anand Jasani",   doctorColor: "#3B82F6", startTime: "11:00", endTime: "12:00", date: toYMD(addDays(_mon, 2)), status: "Confirmed" },
  { id: 6, patientName: "Anjali Mehta",  treatment: "Crown Fitting",     doctor: "Dr. Priya Patel",    doctorColor: "#10B981", startTime: "14:00", endTime: "15:00", date: toYMD(addDays(_mon, 3)), status: "Confirmed" },
  { id: 7, patientName: "Suresh Iyer",   treatment: "Emergency",         doctor: "Dr. Michael Foster", doctorColor: "#8B5CF6", startTime: "09:30", endTime: "10:30", date: toYMD(addDays(_mon, 4)), status: "Completed" },
  { id: 8, patientName: "Divya Nair",    treatment: "Consultation",      doctor: "Dr. Sarah Lee",      doctorColor: "#F59E0B", startTime: "16:00", endTime: "16:30", date: toYMD(addDays(_mon, 4)), status: "Confirmed" },
];

// ── Shared utilities ──────────────────────────────────────────────────────────

function getPosition(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = sh * 60 + sm - 8 * 60;
  const duration  = (eh * 60 + em) - (sh * 60 + sm);
  return { top: (startMins / 30) * 48, height: Math.max((duration / 30) * 48, 24) };
}

function statusColor(status: string) {
  switch (status) {
    case "Confirmed": return "bg-green-100 text-green-700";
    case "Pending":   return "bg-amber-100 text-amber-700";
    case "Completed": return "bg-blue-100 text-blue-700";
    case "Cancelled": return "bg-gray-100 text-gray-700";
    default:          return "bg-gray-100 text-gray-700";
  }
}

// ── Appointment Modal ─────────────────────────────────────────────────────────

function calcDurationLabel(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  const map: Record<number, string> = { 15: "15 min", 30: "30 min", 45: "45 min", 60: "1 hour", 90: "1.5 hours", 120: "2 hours" };
  return map[diff] ?? "30 min";
}

function AppointmentModal({ onClose, onSave, onCancelApt, defaultDate, editing }: {
  onClose: () => void;
  onSave: (apt: Appointment) => void;
  onCancelApt?: () => void;
  defaultDate?: string;
  editing?: Appointment;
}) {
  const [topTab, setTopTab] = useState<TopTab>("appointment");
  const [subTab, setSubTab] = useState<ApptSubTab>("single");
  const [center, setCenter] = useState("Virani chowk");
  const [operatory, setOperatory] = useState("");
  const [doctor, setDoctor] = useState(editing?.doctor ?? "Dr. Anand Jasani");
  const [patient, setPatient] = useState(editing?.patientName ?? "");
  const [treatmentCategory, setTreatmentCategory] = useState("Not Specified");
  const [treatment, setTreatment] = useState(editing?.treatment ?? "");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(editing?.date ?? defaultDate ?? toYMD(new Date()));
  const [time, setTime] = useState(() => {
    if (editing) return editing.startTime;
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [duration, setDuration] = useState(
    editing ? calcDurationLabel(editing.startTime, editing.endTime) : "1 hour"
  );
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!patient.trim()) { setError("Patient name is required."); return; }
    const [h, m] = time.split(":").map(Number);
    const durationMap: Record<string, number> = {
      "15 min": 15, "30 min": 30, "45 min": 45,
      "1 hour": 60, "1.5 hours": 90, "2 hours": 120,
    };
    const endMins = h * 60 + m + (durationMap[duration] ?? 30);
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    const doctorInfo = doctors.find(d => d.name === doctor);
    onSave({
      id: editing?.id ?? Date.now(),
      patientName: patient.trim(),
      treatment: treatment || treatmentCategory,
      doctor,
      doctorColor: doctorInfo?.color ?? "#3B82F6",
      startTime: time,
      endTime,
      date,
      status: editing?.status ?? "Confirmed",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-gray-200">
          <div className="flex gap-6">
            {([
              { id: "appointment", label: "Appointment" },
              { id: "task",        label: "Task" },
              { id: "unavailable", label: "Doctor Unavailable" },
            ] as { id: TopTab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setTopTab(t.id)}
                className={`pb-3 text-sm font-medium transition-colors ${topTab === t.id ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 mb-3"><X className="h-5 w-5" /></button>
        </div>

        {topTab === "appointment" && (
          <div className="flex gap-0 border-b border-gray-200 px-6">
            {([
              { id: "single", label: "Single Appointment" },
              { id: "series", label: "Appointment Series" },
              { id: "group",  label: "Group Appointment" },
            ] as { id: ApptSubTab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                className={`py-3 px-4 text-sm transition-colors ${subTab === t.id ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a] font-semibold" : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-6 items-start">
            <div className="w-24 flex-shrink-0 pt-3 text-sm font-medium text-gray-700">Where</div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <FSelect label="Center" required value={center} onChange={e => setCenter(e.target.value)}
                options={[
                  { value: "Virani chowk", label: "Virani chowk" },
                  { value: "Speedwell",    label: "Speedwell" },
                  { value: "Kothariya",    label: "Kothariya" },
                ]} />
              <FSelect label="Operatory" value={operatory} onChange={e => setOperatory(e.target.value)}
                options={[
                  { value: "",    label: "Select Operatory" },
                  { value: "op1", label: "Operatory 1" },
                  { value: "op2", label: "Operatory 2" },
                ]} />
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-24 flex-shrink-0 pt-3 text-sm font-medium text-gray-700">Who</div>
            <div className="flex-1 space-y-3">
              <FSelect label="Doctor" required value={doctor} onChange={e => setDoctor(e.target.value)}
                options={doctors.map(d => ({ value: d.name, label: `${d.name} - City Dental Hospital` }))} />
              <div className="flex gap-2">
                <FInput label="Patient" required className="flex-1"
                  placeholder="Search by patient id or name or mobile"
                  value={patient} onChange={e => setPatient(e.target.value)} />
                <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0 whitespace-nowrap">
                  <UserPlus className="h-4 w-4" /> New
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-24 flex-shrink-0 pt-3 text-sm font-medium text-gray-700">Purpose</div>
            <div className="flex-1 space-y-3">
              <FSelect label="Treatment Category" required value={treatmentCategory} onChange={e => setTreatmentCategory(e.target.value)}
                options={[
                  { value: "Not Specified", label: "Not Specified" },
                  { value: "Preventive",    label: "Preventive" },
                  { value: "Restorative",   label: "Restorative" },
                  { value: "Orthodontics",  label: "Orthodontics" },
                  { value: "Oral Surgery",  label: "Oral Surgery" },
                ]} />
              <FSelect label="Treatment" value={treatment} onChange={e => setTreatment(e.target.value)}
                options={[
                  { value: "",           label: "Select Treatment" },
                  { value: "checkup",    label: "Check Up / Consultation" },
                  { value: "cleaning",   label: "Dental Cleaning" },
                  { value: "root_canal", label: "Root Canal" },
                  { value: "whitening",  label: "Teeth Whitening" },
                  { value: "crown",      label: "Crown Fitting" },
                  { value: "scaling",    label: "Scaling" },
                ]} />
              <div className="border border-gray-300 rounded-lg px-3 py-2.5">
                <textarea placeholder="Notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-24 flex-shrink-0 pt-3 text-sm font-medium text-gray-700">When</div>
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 px-3 flex-1">
                  <span className="absolute left-3 top-1.5 text-[10px] text-gray-500 leading-none">Date</span>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full pt-5 pb-1.5 text-sm outline-none bg-transparent" />
                </div>
                <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 px-3 flex-1">
                  <span className="absolute left-3 top-1.5 text-[10px] text-gray-500 leading-none">Time</span>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full pt-5 pb-1.5 text-sm outline-none bg-transparent" />
                </div>
                <button className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap flex-shrink-0">
                  Walk-In
                </button>
              </div>
              <FSelect label="Duration" required value={duration} onChange={e => setDuration(e.target.value)} className="w-48"
                options={[
                  { value: "15 min",    label: "15 min" },
                  { value: "30 min",    label: "30 min" },
                  { value: "45 min",    label: "45 min" },
                  { value: "1 hour",    label: "1 hour" },
                  { value: "1.5 hours", label: "1.5 hours" },
                  { value: "2 hours",   label: "2 hours" },
                ]} />
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-24 flex-shrink-0 pt-2 text-sm font-medium text-gray-700">Notifications</div>
            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span className="text-sm text-gray-400 italic">Patient: Email on Confirmation, Email on Reminder</span>
                <CDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {editing && onCancelApt && (
              <button onClick={() => { onCancelApt(); onClose(); }}
                className="px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600 hover:bg-red-100 font-medium">
                Cancel Appointment
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">CLOSE</button>
            <button onClick={handleSave} className="px-6 py-2 bg-[#1e2d5a] rounded text-sm text-white hover:bg-[#1a2650]">
              {editing ? "UPDATE" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({ weekDays, appointments, onCellClick, onAptClick }: {
  weekDays: Date[];
  appointments: Appointment[];
  onCellClick: (date: string) => void;
  onAptClick: (apt: Appointment) => void;
}) {
  const today = new Date();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-secondary">
            <div className="p-4" />
            {weekDays.map(day => (
              <div key={toYMD(day)} className="p-3 text-center">
                <div className="text-xs text-muted-foreground">{day.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                <div className={`mt-1 text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, today) ? "bg-orange-500 text-white" : ""}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
            <div>
              {timeSlots.map((t, i) => (
                <div key={t} className="h-12 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  {i % 2 === 0 ? t : ""}
                </div>
              ))}
            </div>
            {weekDays.map(day => {
              const ymd = toYMD(day);
              const dayAppts = appointments.filter(apt => apt.date === ymd);
              return (
                <div key={ymd} className="relative border-l border-border">
                  {timeSlots.map(t => (
                    <div key={t} className="h-12 border-b border-border cursor-pointer hover:bg-blue-50/20 transition-colors"
                      onClick={() => onCellClick(ymd)} />
                  ))}
                  {dayAppts.map(apt => {
                    const { top, height } = getPosition(apt.startTime, apt.endTime);
                    return (
                      <div key={apt.id}
                        className="absolute left-1 right-1 rounded-xl p-1.5 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all z-10"
                        style={{ top, height, backgroundColor: apt.doctorColor + "1A", borderLeft: `3px solid ${apt.doctorColor}` }}
                        onClick={e => { e.stopPropagation(); onAptClick(apt); }}>
                        <div className="text-xs font-medium text-foreground truncate">{apt.patientName}</div>
                        <div className="text-xs text-muted-foreground truncate">{apt.treatment}</div>
                        <div className="text-xs text-muted-foreground">{apt.startTime}–{apt.endTime}</div>
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] ${statusColor(apt.status)}`}>{apt.status}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({ date, appointments, onAptClick }: { date: Date; appointments: Appointment[]; onAptClick: (apt: Appointment) => void }) {
  const ymd      = toYMD(date);
  const dayAppts = appointments.filter(apt => apt.date === ymd);
  const today    = new Date();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div style={{ minWidth: 420 }}>
        <div className="grid grid-cols-[80px_1fr] border-b border-border">
          <div className="bg-secondary" />
          <div className={`p-4 text-center border-l border-border ${isSameDay(date, today) ? "bg-orange-50" : "bg-secondary"}`}>
            <div className="text-xs text-muted-foreground">{date.toLocaleDateString("en-GB", { weekday: "long" })}</div>
            <div className={`text-xl font-bold mt-0.5 ${isSameDay(date, today) ? "text-orange-500" : ""}`}>
              {date.getDate()} {date.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[80px_1fr]">
          <div>
            {timeSlots.map((t, i) => (
              <div key={t} className="h-12 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                {i % 2 === 0 ? t : ""}
              </div>
            ))}
          </div>
          <div className="relative border-l border-border">
            {timeSlots.map(t => <div key={t} className="h-12 border-b border-border" />)}
            {dayAppts.map(apt => {
              const { top, height } = getPosition(apt.startTime, apt.endTime);
              return (
                <div key={apt.id}
                  className="absolute left-2 right-2 rounded-xl p-2 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
                  style={{ top, height, backgroundColor: apt.doctorColor + "1A", borderLeft: `3px solid ${apt.doctorColor}` }}
                  onClick={() => onAptClick(apt)}>
                  <div className="text-sm font-semibold text-foreground truncate">{apt.patientName}</div>
                  <div className="text-xs text-muted-foreground">{apt.treatment} · {apt.startTime}–{apt.endTime}</div>
                  <div className="text-xs text-muted-foreground">{apt.doctor}</div>
                  <span className={`inline-flex mt-0.5 rounded-full px-2 py-0.5 text-xs ${statusColor(apt.status)}`}>{apt.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({ baseDate, appointments, onDayClick }: {
  baseDate: Date;
  appointments: Appointment[];
  onDayClick: (day: Date) => void;
}) {
  const year  = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const today = new Date();

  const firstDay    = new Date(year, month, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    return dayNum < 1 || dayNum > daysInMonth ? null : new Date(year, month, dayNum);
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border bg-secondary">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="p-3 text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-28 border-b border-r border-border bg-gray-50/50" />;
          const ymd      = toYMD(day);
          const dayAppts = appointments.filter(apt => apt.date === ymd);
          const isToday  = isSameDay(day, today);
          return (
            <div key={ymd}
              className={`h-28 border-b border-r border-border p-1.5 cursor-pointer transition-colors hover:bg-blue-50/30 ${isToday ? "bg-orange-50" : ""}`}
              onClick={() => onDayClick(day)}>
              <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-orange-500 text-white" : "text-foreground"}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayAppts.slice(0, 3).map(apt => (
                  <div key={apt.id} className="text-[10px] truncate rounded px-1 py-0.5"
                    style={{ backgroundColor: apt.doctorColor + "20", color: apt.doctorColor }}>
                    {apt.startTime} {apt.patientName}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} more</div>
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
  const [baseDate,       setBaseDate]       = useState(new Date());
  const [viewMode,       setViewMode]       = useState<"day" | "week" | "month">("week");
  const [appointments,   setAppointments]   = useState<Appointment[]>(initialAppointments);
  const [showModal,      setShowModal]      = useState(false);
  const [modalDate,      setModalDate]      = useState<string | undefined>();
  const [editingApt,     setEditingApt]     = useState<Appointment | undefined>();
  const [visibleDoctors, setVisibleDoctors] = useState<string[]>(doctors.map(d => d.name));

  const weekStart = useMemo(() => getMonday(baseDate), [baseDate.toDateString()]);
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart.toDateString()]);

  const navigate = (dir: number) => {
    if (viewMode === "day")   setBaseDate(d => addDays(d, dir));
    if (viewMode === "week")  setBaseDate(d => addDays(d, dir * 7));
    if (viewMode === "month") setBaseDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + dir); return n; });
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "day")   return fmtShort(baseDate);
    if (viewMode === "week")  return `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}`;
    return fmtMonthYear(baseDate);
  }, [viewMode, baseDate.toDateString()]);

  const toggleDoctor = (name: string) =>
    setVisibleDoctors(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);

  const filteredAppts = appointments.filter(apt => visibleDoctors.includes(apt.doctor));

  const openModal = (date?: string) => { setEditingApt(undefined); setModalDate(date); setShowModal(true); };
  const openEdit  = (apt: Appointment) => { setEditingApt(apt); setModalDate(undefined); setShowModal(true); };

  const handleSave = (apt: Appointment) => {
    if (editingApt) {
      setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a));
      toast.success("Appointment updated successfully", {
        description: `${apt.patientName} · ${apt.date} at ${apt.startTime}`,
      });
    } else {
      setAppointments(prev => [...prev, apt]);
      toast.success("Appointment booked", {
        description: `${apt.patientName} · ${apt.date} at ${apt.startTime}`,
      });
    }
  };

  const handleCancelApt = () => {
    if (editingApt) {
      setAppointments(prev =>
        prev.map(a => a.id === editingApt.id ? { ...a, status: "Cancelled" } : a)
      );
      toast.error("Appointment cancelled", {
        description: `${editingApt.patientName} · ${editingApt.date} at ${editingApt.startTime}`,
      });
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col bg-background p-6 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl">Appointments</h1>
          <button onClick={() => openModal(toYMD(baseDate))}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Appointment
          </button>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}
              className="rounded-xl border border-border bg-card px-3 py-2 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[260px] text-center">{headerLabel}</span>
            <button onClick={() => navigate(1)}
              className="rounded-xl border border-border bg-card px-3 py-2 hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setBaseDate(new Date())}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">
              Today
            </button>
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(["day", "week", "month"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`rounded-lg px-4 py-1.5 text-sm capitalize transition-colors ${viewMode === m ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor legend */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Doctors:</span>
          {doctors.map(doc => (
            <button key={doc.name} onClick={() => toggleDoctor(doc.name)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${visibleDoctors.includes(doc.name) ? "bg-secondary" : "opacity-40 hover:opacity-60"}`}>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: doc.color }} />
              {doc.name}
            </button>
          ))}
        </div>

        {/* View */}
        {viewMode === "week"  && <WeekView  weekDays={weekDays} appointments={filteredAppts} onCellClick={date => openModal(date)} onAptClick={openEdit} />}
        {viewMode === "day"   && <DayView   date={baseDate}     appointments={filteredAppts} onAptClick={openEdit} />}
        {viewMode === "month" && <MonthView baseDate={baseDate} appointments={filteredAppts} onDayClick={d => { setBaseDate(d); setViewMode("day"); }} />}
      </div>

      {showModal && (
        <AppointmentModal
          onClose={() => setShowModal(false)}
          defaultDate={modalDate}
          editing={editingApt}
          onSave={handleSave}
          onCancelApt={handleCancelApt}
        />
      )}
    </>
  );
}
