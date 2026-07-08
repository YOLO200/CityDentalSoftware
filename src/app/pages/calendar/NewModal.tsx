import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronDown, Search, UserPlus, Plus, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Task, DoctorUnavailability, CalendarSettings, Patient, AppointmentStatus, TaskStatus } from "./types";
import {
  CENTERS, DOCTORS, OPERATORS, PATIENTS, TREATMENT_CATS, TREATMENT_MAP,
  SERIES_TYPES, PROJECTS, STAFF, DURATIONS, ALL_STATUSES, UNAVAILABILITY_REASONS,
} from "./mockData";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function endFromDur(start: string, dur: string): string {
  const [h, m] = start.split(":").map(Number);
  const mins = DURATIONS.find(d => d.label === dur)?.mins ?? 60;
  const e = h * 60 + m + mins;
  return `${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`;
}
function addDaysStr(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00"); d.setDate(d.getDate() + n); return toYMD(d);
}
function addWeeksStr(ymd: string, n: number): string { return addDaysStr(ymd, n * 7); }
function addMonthsStr(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00"); d.setMonth(d.getMonth() + n); return toYMD(d);
}
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const m = (t: string) => { const [h,n] = t.split(":").map(Number); return h*60+n; };
  return m(s1) < m(e2) && m(e1) > m(s2);
}
function parseSeriesCount(label: string): number {
  const match = label.match(/\((\d+) sessions?\)/i);
  return match ? parseInt(match[1]) : 4;
}

// ── Floating-label field primitives ───────────────────────────────────────────
function FI({ label, required, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  return (
    <div className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-[#1e2d5a] transition-colors ${className}`}>
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-400 pointer-events-none">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
      <input className={`w-full ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 text-sm outline-none bg-transparent`} {...props} />
    </div>
  );
}

function FS({ label, required, options, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean; options: { value: string; label: string }[] }) {
  return (
    <div className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-[#1e2d5a] transition-colors ${className}`}>
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-400 pointer-events-none z-10">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
      <select className={`w-full appearance-none ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 pr-8 text-sm outline-none bg-transparent`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function FTA({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-[#1e2d5a] ${className}`}>
      {label && <span className="absolute left-3 top-1.5 text-[10px] text-gray-400">{label}</span>}
      <textarea {...props} rows={props.rows ?? 2} className={`w-full ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 text-sm outline-none bg-transparent resize-none`} />
    </div>
  );
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-28 flex-shrink-0 pt-3 text-sm font-semibold text-gray-600">{label}</div>
      <div className="flex-1 space-y-2.5">{children}</div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-500 -mt-1">{msg}</p>;
}

// ── Patient Search ────────────────────────────────────────────────────────────
function PatientSearch({ value, onSelect, allPatients, placeholder = "Search by patient id or name or mobile" }: {
  value: Patient | null;
  onSelect: (p: Patient) => void;
  allPatients: Patient[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return allPatients.slice(0, 8);
    const q = query.toLowerCase();
    return allPatients.filter(p =>
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 8);
  }, [query, allPatients]);

  useEffect(() => { setQuery(value?.name ?? ""); }, [value]);

  return (
    <div className="relative flex-1">
      <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-[#1e2d5a] flex items-center">
        <Search className="h-3.5 w-3.5 text-gray-400 ml-3 flex-shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 pt-5 pb-1.5 pl-2 pr-3 text-sm outline-none bg-transparent"
        />
        <span className="absolute left-8 top-1.5 text-[10px] text-gray-400 pointer-events-none">Patient<span className="text-red-400 ml-0.5">*</span></span>
      </div>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-3 py-2 text-xs text-gray-400">No patients found</div>
            : filtered.map(p => (
              <button key={p.id} onMouseDown={() => { onSelect(p); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1e2d5a]/10 flex items-center justify-center text-xs font-bold text-[#1e2d5a] flex-shrink-0">
                  {p.name[0]}
                </div>
                <div>
                  <div className="font-medium text-gray-800 text-xs">{p.name}</div>
                  <div className="text-[10px] text-gray-400">{p.id} · {p.phone}</div>
                </div>
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Quick Patient Modal ───────────────────────────────────────────────────────
function QuickPatientModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (p: Patient) => void;
}) {
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err,   setErr]   = useState("");

  const save = () => {
    if (!name.trim())  { setErr("Name is required."); return; }
    if (!phone.trim()) { setErr("Mobile number is required."); return; }
    const newPatient: Patient = { id: `P${String(Date.now()).slice(-3)}`, name: name.trim(), phone, email: email || undefined };
    PATIENTS.push(newPatient);
    onCreate(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[#1e2d5a]">New Patient</h4>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400 hover:text-red-500" /></button>
        </div>
        {err && <p className="text-xs text-red-500 mb-3 bg-red-50 border border-red-100 rounded px-2 py-1">{err}</p>}
        <div className="space-y-3">
          <FI label="Full Name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riya Mehta" />
          <FI label="Mobile Number" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" type="tel" />
          <FI label="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-[#1e2d5a] rounded text-sm text-white hover:bg-[#1a2650]">Save Patient</button>
        </div>
      </div>
    </div>
  );
}

// ── Notification Settings ─────────────────────────────────────────────────────
const NOTIF_OPTIONS = [
  { key: "patientConfirmSMS",      label: "Patient confirmation SMS"     },
  { key: "patientConfirmWA",       label: "Patient confirmation WhatsApp" },
  { key: "patientConfirmEmail",    label: "Patient confirmation Email"   },
  { key: "patientReminderSMS",     label: "Patient reminder SMS"         },
  { key: "patientReminderWA",      label: "Patient reminder WhatsApp"    },
  { key: "patientReminderEmail",   label: "Patient reminder Email"       },
  { key: "doctorNotification",     label: "Doctor notification"          },
  { key: "operatorNotification",   label: "Operator notification"        },
];

function NotificationSettings() {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    patientConfirmEmail: true, patientReminderEmail: true,
  });

  const active = NOTIF_OPTIONS.filter(o => checked[o.key]);
  const summary = active.length
    ? `Patient: ${active.map(o => o.label.replace("Patient ", "")).join(", ")}`
    : "No notifications configured";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
        <span className="text-sm text-gray-500 italic truncate text-left">{summary}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3 grid grid-cols-2 gap-2 bg-gray-50">
          {NOTIF_OPTIONS.map(o => (
            <label key={o.key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={!!checked[o.key]}
                onChange={e => setChecked(p => ({ ...p, [o.key]: e.target.checked }))}
                className="rounded border-gray-300" />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group Patient Selector ─────────────────────────────────────────────────────
function GroupPatientSelector({ selected, onChange }: {
  selected: Patient[];
  onChange: (p: Patient[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PATIENTS.filter(p =>
      !selected.find(s => s.id === p.id) &&
      (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q))
    ).slice(0, 6);
  }, [query, selected]);

  const add = (p: Patient) => { onChange([...selected, p]); setQuery(""); };
  const remove = (id: string) => onChange(selected.filter(p => p.id !== id));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
        {selected.map(p => (
          <span key={p.id} className="inline-flex items-center gap-1 bg-[#1e2d5a]/10 text-[#1e2d5a] text-xs px-2 py-1 rounded-full font-medium">
            {p.name}
            <button onClick={() => remove(p.id)} className="hover:text-red-500 ml-0.5"><X className="h-3 w-3" /></button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-xs text-gray-400 self-center">No patients selected</span>}
      </div>
      <div className="relative">
        <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-[#1e2d5a] flex items-center">
          <Search className="h-3.5 w-3.5 text-gray-400 ml-3 flex-shrink-0" />
          <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search and add patients..."
            className="flex-1 py-2 pl-2 pr-3 text-sm outline-none bg-transparent" />
        </div>
        {open && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-2 text-xs text-gray-400">No patients found</div>
              : filtered.map(p => (
                <button key={p.id} onMouseDown={() => add(p)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-400">· {p.id} · {p.phone}</span>
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── Conflict Warning Modal ────────────────────────────────────────────────────
function ConflictWarning({ conflicts, onCancel, onSaveAnyway, onSkipConflicts }: {
  conflicts: string[];
  onCancel: () => void;
  onSaveAnyway: () => void;
  onSkipConflicts?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h4 className="font-semibold text-amber-700 mb-1">⚠ Scheduling Conflicts</h4>
        <p className="text-sm text-gray-500 mb-3">The following conflicts were detected:</p>
        <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto">
          {conflicts.map((c, i) => (
            <li key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">• {c}</li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          {onSkipConflicts && (
            <button onClick={onSkipConflicts} className="w-full py-2 border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50">
              Skip conflicting slots and save rest
            </button>
          )}
          <button onClick={onSaveAnyway} className="w-full py-2 bg-[#1e2d5a] text-white rounded-lg text-sm hover:bg-[#1a2650]">
            Save anyway
          </button>
          <button onClick={onCancel} className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 1A: Single Appointment Form ───────────────────────────────────────────────
function SingleAppointmentForm({ registerSave, onClose, onSaveAppointments, existingAppointments, defaultDate, defaultDoctor }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveAppointments: (apts: Appointment[]) => void;
  existingAppointments: Appointment[];
  defaultDate?: string;
  defaultDoctor?: string;
}) {
  const [center,   setCenter]   = useState(CENTERS[0].name);
  const [operatory,setOperatory]= useState("");
  const [doctor,   setDoctor]   = useState(defaultDoctor ?? DOCTORS[0].name);
  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [isNew,    setIsNew]    = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [cat,      setCat]      = useState("Not Specified");
  const [treat,    setTreat]    = useState("");
  const [notes,    setNotes]    = useState("");
  const [date,     setDate]     = useState(defaultDate ?? toYMD(new Date()));
  const [time,     setTime]     = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; });
  const [dur,      setDur]      = useState("30 min");
  const [status,   setStatus]   = useState<AppointmentStatus>("Scheduled");
  const [hasPay,   setHasPay]   = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [showQuick,setShowQuick]= useState(false);
  const [conflicts,setConflicts]= useState<string[]>([]);

  const allPatients = [...PATIENTS];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!patient)         e.patient = "Please select a patient.";
    if (!date)            e.date    = "Date is required.";
    if (!time)            e.time    = "Start time is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildConflicts = (): string[] => {
    const endTime = endFromDur(time, dur);
    const result: string[] = [];
    existingAppointments.forEach(a => {
      if (a.status === "Cancelled" || a.status === "Completed" || a.status === "No-show") return;
      if (a.date !== date) return;
      if (a.doctor === doctor && timesOverlap(time, endTime, a.startTime, a.endTime)) {
        result.push(`${doctor} already has an appointment with ${a.patientName} at ${a.startTime}`);
      }
      if (patient && a.patientName === patient.name && timesOverlap(time, endTime, a.startTime, a.endTime)) {
        result.push(`${patient.name} already has an appointment at ${a.startTime}`);
      }
    });
    const c = CENTERS.find(c => c.name === center);
    if (c) {
      const m = (t: string) => { const [h,n] = t.split(":").map(Number); return h*60+n; };
      const endTime_ = endFromDur(time, dur);
      if (m(time) < m(c.hours.open) || m(endTime_) > m(c.hours.close)) {
        result.push(`Outside ${center} clinic hours (${c.hours.open}–${c.hours.close})`);
      }
    }
    return result;
  };

  const doSave = useCallback(() => {
    if (!validate()) return;
    const found = buildConflicts();
    if (found.length) { setConflicts(found); return; }
    commit();
  }, [patient, date, time, dur, doctor, center, cat, treat, notes, status, hasPay, isWalkIn, isNew, existingAppointments]);

  const commit = () => {
    const doc = DOCTORS.find(d => d.name === doctor)!;
    const apt: Appointment = {
      id: Date.now(),
      appointmentType: isWalkIn ? "Walk-In" : "Regular",
      patientName: patient!.name,
      patientId: patient!.id,
      patientPhone: patient!.phone,
      isNewPatient: isNew,
      doctor, doctorColor: doc.color,
      treatment: treat || (TREATMENT_MAP[cat]?.[0] ?? "Check Up / Consultation"),
      treatmentCategory: cat,
      center, operatory,
      date, startTime: time, endTime: endFromDur(time, dur),
      status, notes, hasPendingPayment: hasPay, isWalkIn,
    };
    onSaveAppointments([apt]);
    onClose();
    toast.success("Appointment booked", { description: `${apt.patientName} · ${apt.date} at ${apt.startTime}` });
  };

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <>
      <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
        {/* Where */}
        <SectionRow label="Where">
          <div className="grid grid-cols-2 gap-3">
            <FS label="Center" required value={center} onChange={e => setCenter(e.target.value)}
              options={CENTERS.map(c => ({ value: c.name, label: c.name }))} />
            <FS label="Operatory" value={operatory} onChange={e => setOperatory(e.target.value)}
              options={[{ value: "", label: "Select Operatory" }, { value: "op1", label: "Operatory 1" }, { value: "op2", label: "Operatory 2" }]} />
          </div>
        </SectionRow>

        {/* Who */}
        <SectionRow label="Who">
          <FS label="Doctor" required value={doctor} onChange={e => setDoctor(e.target.value)}
            options={DOCTORS.map(d => ({ value: d.name, label: d.label }))} />
          <div>
            <div className="flex gap-2">
              <PatientSearch value={patient} onSelect={setPatient} allPatients={allPatients} />
              <button onClick={() => setShowQuick(true)}
                className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0 whitespace-nowrap">
                <UserPlus className="h-4 w-4" /> New
              </button>
            </div>
            <FieldError msg={errors.patient} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer pl-1">
            <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} className="rounded" />
            Mark as new patient
          </label>
        </SectionRow>

        {/* Purpose */}
        <SectionRow label="Purpose">
          <div className="grid grid-cols-2 gap-3">
            <FS label="Treatment Category" required value={cat} onChange={e => { setCat(e.target.value); setTreat(""); }}
              options={TREATMENT_CATS.map(c => ({ value: c, label: c }))} />
            <FS label="Treatment" value={treat} onChange={e => setTreat(e.target.value)}
              options={[{ value: "", label: "Select Treatment" }, ...(TREATMENT_MAP[cat] ?? []).map(t => ({ value: t, label: t }))]} />
          </div>
          <FS label="Status" value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)}
            options={ALL_STATUSES.map(s => ({ value: s, label: s }))} />
          <FTA label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." />
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer pl-1">
            <input type="checkbox" checked={hasPay} onChange={e => setHasPay(e.target.checked)} className="rounded" />
            Has pending payment
          </label>
        </SectionRow>

        {/* When */}
        <SectionRow label="When">
          <div>
            <div className="flex gap-3 items-stretch">
              <div className="flex-1">
                <FI label="Date" required type="date" value={date} onChange={e => setDate(e.target.value)} />
                <FieldError msg={errors.date} />
              </div>
              <div className="flex-1">
                <FI label="Start Time" required type="time" value={time} onChange={e => setTime(e.target.value)} />
                <FieldError msg={errors.time} />
              </div>
              <button onClick={() => { setIsWalkIn(true); const d = new Date(); setTime(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`); }}
                className={`flex-shrink-0 border rounded-lg px-3 text-sm transition-colors ${isWalkIn ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                {isWalkIn ? "✓ Walk-In" : "Walk-In"}
              </button>
            </div>
          </div>
          <FS label="Duration" required value={dur} onChange={e => setDur(e.target.value)}
            options={DURATIONS.map(d => ({ value: d.label, label: d.label }))} className="w-48" />
        </SectionRow>

        {/* Notifications */}
        <SectionRow label="Notifications">
          <NotificationSettings />
        </SectionRow>
      </div>

      {showQuick && <QuickPatientModal onClose={() => setShowQuick(false)} onCreate={p => setPatient(p)} />}
      {conflicts.length > 0 && (
        <ConflictWarning conflicts={conflicts} onCancel={() => setConflicts([])} onSaveAnyway={() => { setConflicts([]); commit(); }} />
      )}
    </>
  );
}

// ── 1B: Appointment Series Form ───────────────────────────────────────────────
function AppointmentSeriesForm({ registerSave, onClose, onSaveAppointments, existingAppointments, defaultDate, defaultDoctor }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveAppointments: (apts: Appointment[]) => void;
  existingAppointments: Appointment[];
  defaultDate?: string;
  defaultDoctor?: string;
}) {
  const [center,    setCenter]    = useState(CENTERS[0].name);
  const [operatory, setOperatory] = useState("");
  const [doctor,    setDoctor]    = useState(defaultDoctor ?? DOCTORS[0].name);
  const [patient,   setPatient]   = useState<Patient | null>(null);
  const [series,    setSeries]    = useState(SERIES_TYPES[0]);
  const [cat,       setCat]       = useState("Not Specified");
  const [startDate, setStartDate] = useState(defaultDate ?? toYMD(new Date()));
  const [time,      setTime]      = useState("09:00");
  const [remDay,    setRemDay]    = useState("on Prev day");
  const [remTime,   setRemTime]   = useState("08:00");
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [pendingApts, setPendingApts] = useState<Appointment[]>([]);

  const buildAppointments = (): Appointment[] => {
    const doc = DOCTORS.find(d => d.name === doctor)!;
    const count = parseSeriesCount(series);
    const seriesId = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      id: seriesId + i,
      appointmentType: "Series" as const,
      patientName: patient!.name,
      patientId: patient!.id,
      patientPhone: patient!.phone,
      isNewPatient: false,
      doctor, doctorColor: doc.color,
      treatment: TREATMENT_MAP[cat]?.[0] ?? "Check Up / Consultation",
      treatmentCategory: cat,
      center, operatory,
      date: addWeeksStr(startDate, i),
      startTime: time,
      endTime: endFromDur(time, "1 hour"),
      status: "Scheduled" as AppointmentStatus,
      notes: `Series: ${series} — Session ${i + 1} of ${count}`,
      hasPendingPayment: false,
      seriesId,
    }));
  };

  const doSave = useCallback(() => {
    const e: Record<string, string> = {};
    if (!patient)    e.patient = "Please select a patient.";
    if (!startDate)  e.startDate = "Start date is required.";
    if (!time)       e.time = "Time is required.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const apts = buildAppointments();
    const found: string[] = [];
    apts.forEach(a => {
      existingAppointments.forEach(ex => {
        if (ex.doctor === doctor && ex.date === a.date && timesOverlap(time, a.endTime, ex.startTime, ex.endTime)) {
          found.push(`${doctor} has a conflict on ${a.date} at ${time}`);
        }
      });
    });

    if (found.length) { setConflicts(found); setPendingApts(apts); return; }
    onSaveAppointments(apts);
    onClose();
    toast.success(`Appointment series created — ${apts.length} sessions scheduled`);
  }, [patient, startDate, time, doctor, center, cat, series, existingAppointments]);

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <>
      <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
        <SectionRow label="Where">
          <div className="grid grid-cols-2 gap-3">
            <FS label="Center" required value={center} onChange={e => setCenter(e.target.value)}
              options={CENTERS.map(c => ({ value: c.name, label: c.name }))} />
            <FS label="Operatory" value={operatory} onChange={e => setOperatory(e.target.value)}
              options={[{ value: "", label: "Select Operatory" }, { value: "op1", label: "Operatory 1" }, { value: "op2", label: "Operatory 2" }]} />
          </div>
        </SectionRow>

        <SectionRow label="Who">
          <FS label="Doctor" required value={doctor} onChange={e => setDoctor(e.target.value)}
            options={DOCTORS.map(d => ({ value: d.name, label: d.label }))} />
          <div>
            <PatientSearch value={patient} onSelect={setPatient} allPatients={PATIENTS} />
            <FieldError msg={errors.patient} />
          </div>
        </SectionRow>

        <SectionRow label="Purpose">
          <FS label="Appointment Series" required value={series} onChange={e => setSeries(e.target.value)}
            options={SERIES_TYPES.map(s => ({ value: s, label: s }))} />
          <FS label="Treatment Category" required value={cat} onChange={e => setCat(e.target.value)}
            options={TREATMENT_CATS.map(c => ({ value: c, label: c }))} />
        </SectionRow>

        <SectionRow label="When">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FI label="Start Date" required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <FieldError msg={errors.startDate} />
            </div>
            <div>
              <FI label="Time" required type="time" value={time} onChange={e => setTime(e.target.value)} />
              <FieldError msg={errors.time} />
            </div>
          </div>
          {startDate && (
            <div className="text-xs text-gray-500 bg-blue-50 rounded px-3 py-2 border border-blue-100">
              Creates {parseSeriesCount(series)} weekly appointments starting {startDate}
            </div>
          )}
        </SectionRow>

        <SectionRow label="Reminder">
          <div className="grid grid-cols-2 gap-3">
            <FS label="Remind patient" value={remDay} onChange={e => setRemDay(e.target.value)}
              options={["on Prev day","on Same day","2 days before","1 week before"].map(v => ({ value: v, label: v }))} />
            <FI label="Reminder time" required type="time" value={remTime} onChange={e => setRemTime(e.target.value)} />
          </div>
        </SectionRow>
      </div>

      {conflicts.length > 0 && (
        <ConflictWarning
          conflicts={conflicts}
          onCancel={() => { setConflicts([]); setPendingApts([]); }}
          onSaveAnyway={() => {
            onSaveAppointments(pendingApts);
            setConflicts([]); setPendingApts([]);
            onClose();
            toast.success(`Appointment series created — ${pendingApts.length} sessions scheduled`);
          }}
          onSkipConflicts={() => {
            const skip = new Set(conflicts.map(c => c.match(/on (.+) at/)?.[1]).filter(Boolean));
            const filtered = pendingApts.filter(a => !skip.has(a.date));
            onSaveAppointments(filtered);
            setConflicts([]); setPendingApts([]);
            onClose();
            toast.success(`Appointment series created — ${filtered.length} sessions scheduled (${pendingApts.length - filtered.length} skipped)`);
          }}
        />
      )}
    </>
  );
}

// ── 1C: Group Appointment Form ────────────────────────────────────────────────
function GroupAppointmentForm({ registerSave, onClose, onSaveAppointments, defaultDate, defaultDoctor }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveAppointments: (apts: Appointment[]) => void;
  defaultDate?: string;
  defaultDoctor?: string;
}) {
  const [center,    setCenter]    = useState(CENTERS[0].name);
  const [operatory, setOperatory] = useState("");
  const [doctor,    setDoctor]    = useState(defaultDoctor ?? DOCTORS[0].name);
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [cat,       setCat]       = useState("Not Specified");
  const [treat,     setTreat]     = useState("");
  const [title,     setTitle]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [date,      setDate]      = useState(defaultDate ?? toYMD(new Date()));
  const [time,      setTime]      = useState("09:00");
  const [dur,       setDur]       = useState("1 hour");
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const doSave = useCallback(() => {
    const e: Record<string, string> = {};
    if (patients.length < 2) e.patients = "At least 2 patients are required for a group appointment.";
    if (!date)  e.date = "Date is required.";
    if (!time)  e.time = "Time is required.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const doc = DOCTORS.find(d => d.name === doctor)!;
    const groupId = Date.now();
    const groupTitle = title || `Group Appointment — ${patients.length} Patients`;
    const apts: Appointment[] = patients.map((p, i) => ({
      id: groupId + i,
      appointmentType: "Group" as const,
      patientName: p.name,
      patientId: p.id,
      patientPhone: p.phone,
      isNewPatient: false,
      doctor, doctorColor: doc.color,
      treatment: treat || (TREATMENT_MAP[cat]?.[0] ?? "Check Up / Consultation"),
      treatmentCategory: cat,
      center, operatory,
      date, startTime: time, endTime: endFromDur(time, dur),
      status: "Scheduled" as AppointmentStatus,
      notes,
      hasPendingPayment: false,
      groupId,
      groupTitle,
      groupPatients: patients.map(p => ({ id: p.id, name: p.name })),
    }));
    onSaveAppointments(apts);
    onClose();
    toast.success(`Group appointment created — ${patients.length} patients`, { description: `${date} at ${time}` });
  }, [patients, date, time, dur, doctor, center, cat, treat, title, notes]);

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
      <SectionRow label="Where">
        <div className="grid grid-cols-2 gap-3">
          <FS label="Center" required value={center} onChange={e => setCenter(e.target.value)}
            options={CENTERS.map(c => ({ value: c.name, label: c.name }))} />
          <FS label="Operatory" value={operatory} onChange={e => setOperatory(e.target.value)}
            options={[{ value: "", label: "Select Operatory" }, { value: "op1", label: "Operatory 1" }, { value: "op2", label: "Operatory 2" }]} />
        </div>
      </SectionRow>

      <SectionRow label="Who">
        <FS label="Doctor" required value={doctor} onChange={e => setDoctor(e.target.value)}
          options={DOCTORS.map(d => ({ value: d.name, label: d.label }))} />
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Patients<span className="text-red-400 ml-0.5">*</span> (min 2)</div>
          <GroupPatientSelector selected={patients} onChange={setPatients} />
          <FieldError msg={errors.patients} />
        </div>
      </SectionRow>

      <SectionRow label="Purpose">
        <FI label="Group appointment title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. School Dental Camp — Grade 5" />
        <div className="grid grid-cols-2 gap-3">
          <FS label="Treatment Category" required value={cat} onChange={e => { setCat(e.target.value); setTreat(""); }}
            options={TREATMENT_CATS.map(c => ({ value: c, label: c }))} />
          <FS label="Treatment" value={treat} onChange={e => setTreat(e.target.value)}
            options={[{ value: "", label: "Select Treatment" }, ...(TREATMENT_MAP[cat] ?? []).map(t => ({ value: t, label: t }))]} />
        </div>
        <FTA label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Group session notes..." />
      </SectionRow>

      <SectionRow label="When">
        <div className="flex gap-3">
          <div className="flex-1">
            <FI label="Date" required type="date" value={date} onChange={e => setDate(e.target.value)} />
            <FieldError msg={errors.date} />
          </div>
          <div className="flex-1">
            <FI label="Start Time" required type="time" value={time} onChange={e => setTime(e.target.value)} />
            <FieldError msg={errors.time} />
          </div>
        </div>
        <FS label="Duration" required value={dur} onChange={e => setDur(e.target.value)}
          options={DURATIONS.map(d => ({ value: d.label, label: d.label }))} className="w-48" />
      </SectionRow>
    </div>
  );
}

// ── 2A: Single Task Form ──────────────────────────────────────────────────────
function SingleTaskForm({ registerSave, onClose, onSaveTask, defaultDate }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveTask: (tasks: Task[]) => void;
  defaultDate?: string;
}) {
  const [center,       setCenter]       = useState(CENTERS[0].name);
  const [name,         setName]         = useState("");
  const [project,      setProject]      = useState("");
  const [assignedTo,   setAssignedTo]   = useState("");
  const [patientQ,     setPatientQ]     = useState<Patient | null>(null);
  const [date,         setDate]         = useState(defaultDate ?? toYMD(new Date()));
  const [startTime,    setStartTime]    = useState("09:00");
  const [endTime,      setEndTime]      = useState("10:00");
  const [allDay,       setAllDay]       = useState(false);
  const [disallow,     setDisallow]     = useState(false);
  const [dueDate,      setDueDate]      = useState("");
  const [dueTime,      setDueTime]      = useState("");
  const [taskStatus,   setTaskStatus]   = useState<TaskStatus>("New");
  const [notes,        setNotes]        = useState("");
  const [showOnCal,    setShowOnCal]    = useState(true);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const doSave = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Task name is required.";
    if (!center)      e.center = "Center is required.";
    if (dueDate && date && dueDate < date) e.dueDate = "Due date cannot be before task date.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const task: Task = {
      id: Date.now(),
      name: name.trim(),
      center, project: project || undefined,
      assignedTo: assignedTo || undefined,
      patientId: patientQ?.id,
      patientName: patientQ?.name,
      date: date || undefined,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      allDay,
      disallowAppointments: disallow,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      status: taskStatus,
      notes: notes || undefined,
      showOnCalendar: showOnCal,
      color: "#6366F1",
    };
    onSaveTask([task]);
    onClose();
    toast.success("Task created", { description: name });
  }, [name, center, project, assignedTo, patientQ, date, startTime, endTime, allDay, disallow, dueDate, dueTime, taskStatus, notes, showOnCal]);

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
      <SectionRow label="Center">
        <FS label="Center" required value={center} onChange={e => setCenter(e.target.value)}
          options={CENTERS.map(c => ({ value: c.name, label: c.name }))} />
        <FieldError msg={errors.center} />
      </SectionRow>

      <SectionRow label="Task Details">
        <div>
          <FI label="Task Name" required value={name} onChange={e => setName(e.target.value)} placeholder="Enter task name" />
          <FieldError msg={errors.name} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FS label="Project" value={project} onChange={e => setProject(e.target.value)}
            options={[{ value: "", label: "Select Project" }, ...PROJECTS.map(p => ({ value: p, label: p }))]} />
          <FS label="Assigned To" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
            options={[{ value: "", label: "Select Assigned To" }, ...STAFF.map(s => ({ value: s, label: s }))]} />
        </div>
        <PatientSearch value={patientQ} onSelect={setPatientQ} allPatients={PATIENTS} placeholder="Link to patient (optional)" />
        <div className="grid grid-cols-3 gap-3">
          <FI label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <FI label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={allDay} />
          <FI label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={allDay} />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
            All day
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={disallow} onChange={e => setDisallow(e.target.checked)} className="rounded" />
            Disallow appointments and show task to all
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showOnCal} onChange={e => setShowOnCal(e.target.checked)} className="rounded" />
            Show on calendar
          </label>
        </div>
      </SectionRow>

      <SectionRow label="Due By">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FI label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <FieldError msg={errors.dueDate} />
          </div>
          <FI label="Due time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
        </div>
      </SectionRow>

      <SectionRow label="Status">
        <FS label="Status" value={taskStatus} onChange={e => setTaskStatus(e.target.value as TaskStatus)}
          options={(["New","In Progress","Completed","Cancelled"] as TaskStatus[]).map(s => ({ value: s, label: s }))} className="w-48" />
      </SectionRow>

      <SectionRow label="Notes">
        <FTA label="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes..." />
      </SectionRow>
    </div>
  );
}

// ── 2B: Recurring Task Form ───────────────────────────────────────────────────
function RecurringTaskForm({ registerSave, onClose, onSaveTask, defaultDate }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveTask: (tasks: Task[]) => void;
  defaultDate?: string;
}) {
  const [center,     setCenter]     = useState(CENTERS[0].name);
  const [name,       setName]       = useState("");
  const [project,    setProject]    = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [patientQ,   setPatientQ]   = useState<Patient | null>(null);
  const [startDate,  setStartDate]  = useState(defaultDate ?? toYMD(new Date()));
  const [startTime_, setStartTime_] = useState("09:00");
  const [endTime_,   setEndTime_]   = useState("10:00");
  const [freq,       setFreq]       = useState<"Daily"|"Weekly"|"Monthly">("Weekly");
  const [until,      setUntil]      = useState("");
  const [dueDate,    setDueDate]    = useState("");
  const [dueTime,    setDueTime]    = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("New");
  const [disallow,   setDisallow]   = useState(false);
  const [showOnCal,  setShowOnCal]  = useState(true);
  const [notes,      setNotes]      = useState("");
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  const doSave = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Task name is required.";
    if (!startDate)   e.startDate = "Start date is required.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const limit = until || addWeeksStr(startDate, 8);
    const tasks: Task[] = [];
    let cur = startDate;
    let idx = 0;

    while (cur <= limit && idx < 52) {
      tasks.push({
        id: Date.now() + idx,
        name: name.trim(),
        center, project: project || undefined,
        assignedTo: assignedTo || undefined,
        patientId: patientQ?.id, patientName: patientQ?.name,
        date: cur, startTime: startTime_, endTime: endTime_,
        disallowAppointments: disallow,
        dueDate: dueDate || undefined, dueTime: dueTime || undefined,
        status: taskStatus,
        notes: notes || undefined,
        isRecurring: true, repeatFrequency: freq, repeatUntil: until || undefined,
        showOnCalendar: showOnCal, color: "#6366F1",
      });
      cur = freq === "Daily" ? addDaysStr(cur, 1) : freq === "Weekly" ? addWeeksStr(cur, 1) : addMonthsStr(cur, 1);
      idx++;
    }

    onSaveTask(tasks);
    onClose();
    toast.success(`${tasks.length} recurring tasks created`, { description: name });
  }, [name, center, project, assignedTo, patientQ, startDate, startTime_, endTime_, freq, until, dueDate, dueTime, taskStatus, notes, disallow, showOnCal]);

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
      <SectionRow label="Center">
        <FS label="Center" required value={center} onChange={e => setCenter(e.target.value)}
          options={CENTERS.map(c => ({ value: c.name, label: c.name }))} />
      </SectionRow>

      <SectionRow label="Task Details">
        <div>
          <FI label="Task Name" required value={name} onChange={e => setName(e.target.value)} placeholder="Enter task name" />
          <FieldError msg={errors.name} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FS label="Project" value={project} onChange={e => setProject(e.target.value)}
            options={[{ value: "", label: "Select Project" }, ...PROJECTS.map(p => ({ value: p, label: p }))]} />
          <FS label="Assigned To" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
            options={[{ value: "", label: "Select Assigned To" }, ...STAFF.map(s => ({ value: s, label: s }))]} />
        </div>
        <PatientSearch value={patientQ} onSelect={setPatientQ} allPatients={PATIENTS} placeholder="Link to patient (optional)" />
      </SectionRow>

      <SectionRow label="Schedule">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <FI label="Start Date" required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <FieldError msg={errors.startDate} />
          </div>
          <FI label="Start Time" type="time" value={startTime_} onChange={e => setStartTime_(e.target.value)} />
          <FI label="End Time" type="time" value={endTime_} onChange={e => setEndTime_(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FS label="Repeat" required value={freq} onChange={e => setFreq(e.target.value as "Daily"|"Weekly"|"Monthly")}
            options={["Daily","Weekly","Monthly"].map(v => ({ value: v, label: v }))} />
          <FI label="Repeat until" type="date" value={until} onChange={e => setUntil(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={disallow} onChange={e => setDisallow(e.target.checked)} className="rounded" />
          Disallow appointments during task time
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showOnCal} onChange={e => setShowOnCal(e.target.checked)} className="rounded" />
          Show on calendar
        </label>
      </SectionRow>

      <SectionRow label="Due By">
        <div className="grid grid-cols-2 gap-3">
          <FI label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <FI label="Due time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
        </div>
      </SectionRow>

      <SectionRow label="Status">
        <FS label="Status" value={taskStatus} onChange={e => setTaskStatus(e.target.value as TaskStatus)}
          options={(["New","In Progress","Completed","Cancelled"] as TaskStatus[]).map(s => ({ value: s, label: s }))} className="w-48" />
      </SectionRow>

      <SectionRow label="Notes">
        <FTA value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes..." />
      </SectionRow>
    </div>
  );
}

// ── 2C: Show on Calendar ──────────────────────────────────────────────────────
const TASK_VIS_OPTIONS = [
  { value: "all",       label: "All users"        },
  { value: "assigned",  label: "Only assigned user"},
  { value: "doctors",   label: "Doctors only"      },
  { value: "operators", label: "Operators only"    },
];

const TASK_COLORS = ["#6366F1","#F59E0B","#10B981","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];

function ShowOnCalendarForm({ registerSave, onClose, calendarSettings, onUpdateCalendarSettings }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  calendarSettings: CalendarSettings;
  onUpdateCalendarSettings: (s: Partial<CalendarSettings>) => void;
}) {
  const [show,    setShow]    = useState(calendarSettings.showTasksOnCalendar);
  const [vis,     setVis]     = useState(calendarSettings.taskVisibility);
  const [color,   setColor]   = useState(calendarSettings.taskColor);
  const [projF,   setProjF]   = useState(calendarSettings.filterProject ?? "");
  const [userF,   setUserF]   = useState(calendarSettings.filterAssignedUser ?? "");

  const doSave = useCallback(() => {
    onUpdateCalendarSettings({ showTasksOnCalendar: show, taskVisibility: vis, taskColor: color, filterProject: projF || undefined, filterAssignedUser: userF || undefined });
    onClose();
    toast.success("Calendar task settings updated");
  }, [show, vis, color, projF, userF]);

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">Show tasks on calendar</div>
          <div className="text-xs text-gray-500">Tasks with a date/time will appear as blocks on the calendar</div>
        </div>
        <button onClick={() => setShow(v => !v)}
          className={`w-10 h-6 rounded-full transition-colors relative ${show ? "bg-[#1e2d5a]" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${show ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div className="space-y-3">
        <FS label="Task visibility" value={vis} onChange={e => setVis(e.target.value as typeof vis)}
          options={TASK_VIS_OPTIONS} />
        <div>
          <div className="text-[10px] text-gray-400 mb-1.5">Task block color</div>
          <div className="flex gap-2">
            {TASK_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-[#1e2d5a] scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FS label="Filter by project" value={projF} onChange={e => setProjF(e.target.value)}
            options={[{ value: "", label: "All projects" }, ...PROJECTS.map(p => ({ value: p, label: p }))]} />
          <FS label="Filter by assigned user" value={userF} onChange={e => setUserF(e.target.value)}
            options={[{ value: "", label: "All users" }, ...STAFF.map(s => ({ value: s, label: s }))]} />
        </div>
      </div>
    </div>
  );
}

// ── 3: Doctor Unavailable Form ────────────────────────────────────────────────
function DoctorUnavailableForm({ registerSave, onClose, onSaveUnavailability, existingAppointments }: {
  registerSave: (fn: () => void) => void;
  onClose: () => void;
  onSaveUnavailability: (blocks: DoctorUnavailability[]) => void;
  existingAppointments: Appointment[];
}) {
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [fromDate,   setFromDate]   = useState(toYMD(new Date()));
  const [fromTime,   setFromTime]   = useState("09:00");
  const [toDate,     setToDate]     = useState(toYMD(new Date()));
  const [toTime,     setToTime]     = useState("10:00");
  const [reason,     setReason]     = useState(UNAVAILABILITY_REASONS[0]);
  const [desc,       setDesc]       = useState("");
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [conflicts,  setConflicts]  = useState<string[]>([]);
  const [pending,    setPending]    = useState<DoctorUnavailability[]>([]);
  const [docOpen,    setDocOpen]    = useState(false);

  const toggleDoctor = (name: string) => setSelectedDoctors(p => p.includes(name) ? p.filter(d => d !== name) : [...p, name]);

  const buildBlocks = (): DoctorUnavailability[] => {
    const id = Date.now();
    if (selectedDoctors.length === 0) return [];
    return [{ id, doctors: selectedDoctors, fromDate, fromTime, toDate, toTime, reason, description: desc || undefined }];
  };

  const findConflicts = (blocks: DoctorUnavailability[]): string[] => {
    const result: string[] = [];
    blocks.forEach(block => {
      block.doctors.forEach(docName => {
        existingAppointments.forEach(apt => {
          if (apt.doctor !== docName) return;
          if (apt.status === "Cancelled" || apt.status === "Completed") return;
          if (apt.date >= block.fromDate && apt.date <= block.toDate) {
            result.push(`${docName} has an appointment with ${apt.patientName} on ${apt.date} at ${apt.startTime}`);
          }
        });
      });
    });
    return result;
  };

  const doSave = useCallback(() => {
    const e: Record<string, string> = {};
    if (selectedDoctors.length === 0)  e.doctors   = "Please select at least one doctor.";
    if (!fromDate || !fromTime)        e.from      = "From date and time are required.";
    if (!toDate || !toTime)            e.to        = "To date and time are required.";
    if (fromDate > toDate || (fromDate === toDate && fromTime >= toTime)) e.to = "To must be after From.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const blocks = buildBlocks();
    const found = findConflicts(blocks);
    if (found.length) { setConflicts(found); setPending(blocks); return; }
    commit(blocks);
  }, [selectedDoctors, fromDate, fromTime, toDate, toTime, reason, desc, existingAppointments]);

  const commit = (blocks: DoctorUnavailability[]) => {
    onSaveUnavailability(blocks);
    onClose();
    toast.success("Doctor unavailability saved", { description: `${selectedDoctors.join(", ")} · ${fromDate} ${fromTime}–${toDate} ${toTime}` });
  };

  useEffect(() => { registerSave(doSave); }, [doSave, registerSave]);

  return (
    <>
      <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
        <h3 className="text-base font-semibold text-[#1e2d5a]">Add Unavailability</h3>

        {/* Doctor multi-select */}
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Doctor(s)<span className="text-red-400 ml-0.5">*</span></div>
          <div className="relative">
            <button onClick={() => setDocOpen(o => !o)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:border-[#1e2d5a] outline-none">
              <span className={selectedDoctors.length ? "text-gray-800" : "text-gray-400"}>
                {selectedDoctors.length ? selectedDoctors.join(", ") : "Select Doctor(s)"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {docOpen && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {DOCTORS.map(d => (
                  <button key={d.name} onClick={() => toggleDoctor(d.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDoctors.includes(d.name) ? "bg-[#1e2d5a] border-[#1e2d5a]" : "border-gray-300"}`}>
                      {selectedDoctors.includes(d.name) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <FieldError msg={errors.doctors} />
        </div>

        {/* From / To */}
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Unavailability period</div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <FI label="From date" required type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <FieldError msg={errors.from} />
            </div>
            <FI label="From time" required type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FI label="To date" required type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              <FieldError msg={errors.to} />
            </div>
            <FI label="To time" required type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
          </div>
        </div>

        {/* Reason */}
        <div>
          <div className="text-[10px] text-gray-400 mb-1">Reason<span className="text-red-400 ml-0.5">*</span></div>
          <FS value={reason} onChange={e => setReason(e.target.value)}
            options={UNAVAILABILITY_REASONS.map(r => ({ value: r, label: r }))} />
        </div>

        <FTA label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Additional details..." />
      </div>

      {conflicts.length > 0 && (
        <ConflictWarning
          conflicts={conflicts}
          onCancel={() => { setConflicts([]); setPending([]); }}
          onSaveAnyway={() => { commit(pending); setConflicts([]); setPending([]); }}
        />
      )}
    </>
  );
}

// ── Main NewModal ─────────────────────────────────────────────────────────────
type TopTab    = "appointment" | "task" | "unavailable";
type ApptSub   = "single" | "series" | "group";
type TaskSub   = "single" | "recurring" | "calendar";

export interface NewModalProps {
  onClose: () => void;
  onSaveAppointments: (apts: Appointment[]) => void;
  onSaveTasks: (tasks: Task[]) => void;
  onSaveUnavailability: (blocks: DoctorUnavailability[]) => void;
  onUpdateCalendarSettings: (s: Partial<CalendarSettings>) => void;
  existingAppointments: Appointment[];
  existingUnavailability: DoctorUnavailability[];
  defaultDate?: string;
  defaultDoctor?: string;
  calendarSettings: CalendarSettings;
}

export function NewModal(props: NewModalProps) {
  const { onClose, onSaveAppointments, onSaveTasks, onSaveUnavailability, onUpdateCalendarSettings,
    existingAppointments, existingUnavailability: _eu, defaultDate, defaultDoctor, calendarSettings } = props;

  const [topTab,   setTopTab]   = useState<TopTab>("appointment");
  const [apptSub,  setApptSub]  = useState<ApptSub>("single");
  const [taskSub,  setTaskSub]  = useState<TaskSub>("single");
  const [saving,   setSaving]   = useState(false);

  const saveFnRef = useRef<() => void>(() => {});
  const registerSave = useCallback((fn: () => void) => { saveFnRef.current = fn; }, []);

  const handleSave = async () => {
    setSaving(true);
    try { saveFnRef.current(); } finally { setSaving(false); }
  };

  const TOP_TABS: { id: TopTab; label: string }[] = [
    { id: "appointment",  label: "Appointment"        },
    { id: "task",         label: "Task"               },
    { id: "unavailable",  label: "Doctor Unavailable" },
  ];

  const APPT_SUBS: { id: ApptSub; label: string }[] = [
    { id: "single",  label: "Single Appointment"  },
    { id: "series",  label: "Appointment Series"  },
    { id: "group",   label: "Group Appointment"   },
  ];

  const TASK_SUBS: { id: TaskSub; label: string }[] = [
    { id: "single",    label: "Single Task"       },
    { id: "recurring", label: "Recurring Tasks"   },
    { id: "calendar",  label: "Show on Calendar"  },
  ];

  const formKey = `${topTab}-${apptSub}-${taskSub}`;

  const sharedFormProps = { registerSave, onClose, existingAppointments, defaultDate, defaultDoctor };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Top tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-6">
            {TOP_TABS.map(t => (
              <button key={t.id} onClick={() => setTopTab(t.id)}
                className={`pb-3 text-sm font-medium transition-colors ${topTab === t.id ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 mb-3">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inner tabs */}
        {topTab === "appointment" && (
          <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
            {APPT_SUBS.map(t => (
              <button key={t.id} onClick={() => setApptSub(t.id)}
                className={`py-2.5 px-4 text-sm transition-colors ${apptSub === t.id ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a] font-semibold" : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        {topTab === "task" && (
          <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
            {TASK_SUBS.map(t => (
              <button key={t.id} onClick={() => setTaskSub(t.id)}
                className={`py-2.5 px-4 text-sm transition-colors ${taskSub === t.id ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a] font-semibold" : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {topTab === "appointment" && apptSub === "single" && (
            <SingleAppointmentForm key={formKey} {...sharedFormProps}
              onSaveAppointments={onSaveAppointments} />
          )}
          {topTab === "appointment" && apptSub === "series" && (
            <AppointmentSeriesForm key={formKey} {...sharedFormProps}
              onSaveAppointments={onSaveAppointments} />
          )}
          {topTab === "appointment" && apptSub === "group" && (
            <GroupAppointmentForm key={formKey} {...sharedFormProps}
              onSaveAppointments={onSaveAppointments} />
          )}
          {topTab === "task" && taskSub === "single" && (
            <SingleTaskForm key={formKey} registerSave={registerSave} onClose={onClose}
              onSaveTask={onSaveTasks} defaultDate={defaultDate} />
          )}
          {topTab === "task" && taskSub === "recurring" && (
            <RecurringTaskForm key={formKey} registerSave={registerSave} onClose={onClose}
              onSaveTask={onSaveTasks} defaultDate={defaultDate} />
          )}
          {topTab === "task" && taskSub === "calendar" && (
            <ShowOnCalendarForm key={formKey} registerSave={registerSave} onClose={onClose}
              calendarSettings={calendarSettings} onUpdateCalendarSettings={onUpdateCalendarSettings} />
          )}
          {topTab === "unavailable" && (
            <DoctorUnavailableForm key={formKey} registerSave={registerSave} onClose={onClose}
              onSaveUnavailability={onSaveUnavailability} existingAppointments={existingAppointments} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
          <button className="text-orange-500 text-sm hover:underline">Need Help?</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-[#1e2d5a] rounded text-sm text-white hover:bg-[#1a2650] disabled:opacity-60 min-w-[80px] flex items-center justify-center gap-2">
              {saving ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
