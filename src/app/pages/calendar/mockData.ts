import type { Patient, Appointment, Task, DoctorUnavailability } from "./types";

// ── Local date helpers (avoid circular import from Calendar) ──────────────────
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Reference data ────────────────────────────────────────────────────────────
export const CENTERS = [
  { id: "speedwell",  name: "Speedwell Premium Division", hours: { open: "09:00", close: "18:00" } },
  { id: "virani",    name: "Virani Chowk",               hours: { open: "09:00", close: "19:00" } },
  { id: "kothariya", name: "Kothariya",                  hours: { open: "10:00", close: "17:00" } },
];

export const DOCTORS = [
  { id: "anand",   name: "Dr. Anand Jasani",   color: "#3B82F6", label: "Dr. Anand - City Dental Hospital"   },
  { id: "priya",   name: "Dr. Priya Patel",    color: "#10B981", label: "Dr. Priya - City Dental Hospital"   },
  { id: "michael", name: "Dr. Michael Foster", color: "#8B5CF6", label: "Dr. Michael - City Dental Hospital" },
  { id: "sarah",   name: "Dr. Sarah Lee",      color: "#F59E0B", label: "Dr. Sarah - City Dental Hospital"   },
];

export const OPERATORS = ["Nurse Rekha", "Nurse Meera", "Nurse Divya", "Assistant Kiran"];

export const PATIENTS: Patient[] = [
  { id: "P001", name: "Rajesh Kumar",    phone: "9876543210", email: "rajesh@email.com" },
  { id: "P002", name: "Priya Sharma",    phone: "9876543211"                            },
  { id: "P003", name: "Amit Singh",      phone: "9876543212"                            },
  { id: "P004", name: "Neha Gupta",      phone: "9876543213", email: "neha@email.com"   },
  { id: "P005", name: "Vikram Reddy",    phone: "9876543214"                            },
  { id: "P006", name: "Anjali Mehta",    phone: "9876543215"                            },
  { id: "P007", name: "Suresh Iyer",     phone: "9876543216"                            },
  { id: "P008", name: "Divya Nair",      phone: "9876543217"                            },
  { id: "P009", name: "Karan Malhotra",  phone: "9876543218"                            },
  { id: "P010", name: "Simran Kaur",     phone: "9876543219", email: "simran@email.com" },
];

export const TREATMENT_CATS = [
  "Not Specified", "Preventive", "Restorative", "Orthodontics",
  "Oral Surgery", "Periodontics", "Endodontics", "Prosthodontics",
];

export const TREATMENT_MAP: Record<string, string[]> = {
  "Not Specified":  ["Check Up / Consultation"],
  "Preventive":     ["Dental Cleaning", "Scaling", "Fluoride Treatment"],
  "Restorative":    ["Filling", "Crown Fitting", "Teeth Whitening"],
  "Orthodontics":   ["Invisalign Review", "Braces Adjustment", "Retainer Fitting"],
  "Oral Surgery":   ["Tooth Extraction", "Implant Placement", "Bone Graft"],
  "Periodontics":   ["Gum Treatment", "Root Planing"],
  "Endodontics":    ["Root Canal", "Pulpotomy"],
  "Prosthodontics": ["Denture Fitting", "Bridge Work"],
};

export const SERIES_TYPES = [
  "Weekly Check-ups (4 sessions)",
  "Monthly Review (3 sessions)",
  "Orthodontic Follow-up (6 sessions)",
  "Post-Surgery Follow-up (3 sessions)",
  "Scaling Series (2 sessions)",
  "Whitening Series (4 sessions)",
];

export const PROJECTS = ["Clinic Operations", "Patient Care", "Marketing", "IT", "Finance", "HR"];

export const STAFF = [
  "Dr. Anand Jasani", "Dr. Priya Patel", "Dr. Michael Foster", "Dr. Sarah Lee",
  "Nurse Rekha", "Nurse Meera", "Nurse Divya", "Assistant Kiran", "Admin Pooja",
];

export const DURATIONS = [
  { label: "15 min",    mins: 15  },
  { label: "30 min",    mins: 30  },
  { label: "45 min",    mins: 45  },
  { label: "1 hour",    mins: 60  },
  { label: "1.5 hours", mins: 90  },
  { label: "2 hours",   mins: 120 },
];

export const ALL_STATUSES = [
  "Scheduled", "Confirmed", "Arrived", "In Waiting",
  "In Treatment", "Completed", "Cancelled", "No-show", "Rescheduled",
] as const;

export const CANCEL_REASONS = [
  "Patient request", "Doctor unavailable", "Emergency",
  "Duplicate booking", "Patient rescheduled", "Other",
];

export const UNAVAILABILITY_REASONS = [
  "Leave", "Lunch Break", "Emergency", "Surgery", "Meeting", "Training", "Personal", "Other",
];

// ── Initial data (anchored to current week) ───────────────────────────────────
const _mon = getMonday(new Date());

function mkApt(o: Partial<Appointment> & Pick<Appointment, "id"|"patientName"|"doctor"|"startTime"|"endTime"|"date"|"status"|"treatment"|"treatmentCategory">): Appointment {
  const doc = DOCTORS.find(d => d.name === o.doctor);
  return {
    appointmentType: "Regular",
    patientId: `P${String(o.id).padStart(3, "0")}`,
    patientPhone: "9876543210",
    isNewPatient: false,
    doctorColor: doc?.color ?? "#3B82F6",
    center: "Speedwell Premium Division",
    notes: "",
    hasPendingPayment: false,
    ...o,
  };
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  mkApt({ id: 1, patientName: "Rajesh Kumar",  doctor: "Dr. Anand Jasani",   startTime: "09:00", endTime: "09:30", date: toYMD(_mon),             status: "Confirmed",    treatment: "Dental Cleaning",         treatmentCategory: "Preventive"    }),
  mkApt({ id: 2, patientName: "Priya Sharma",  doctor: "Dr. Michael Foster", startTime: "10:00", endTime: "11:00", date: toYMD(_mon),             status: "Confirmed",    treatment: "Root Canal",              treatmentCategory: "Endodontics",   notes: "Needs X-ray first" }),
  mkApt({ id: 3, patientName: "Amit Singh",    doctor: "Dr. Priya Patel",    startTime: "13:00", endTime: "13:30", date: toYMD(addDays(_mon, 1)), status: "Scheduled",    treatment: "Check Up / Consultation", treatmentCategory: "Not Specified", isNewPatient: true }),
  mkApt({ id: 4, patientName: "Neha Gupta",    doctor: "Dr. Sarah Lee",      startTime: "15:30", endTime: "16:00", date: toYMD(addDays(_mon, 1)), status: "Confirmed",    treatment: "Invisalign Review",       treatmentCategory: "Orthodontics",  hasPendingPayment: true }),
  mkApt({ id: 5, patientName: "Vikram Reddy",  doctor: "Dr. Anand Jasani",   startTime: "11:00", endTime: "12:00", date: toYMD(addDays(_mon, 2)), status: "In Treatment", treatment: "Teeth Whitening",         treatmentCategory: "Restorative"   }),
  mkApt({ id: 6, patientName: "Anjali Mehta",  doctor: "Dr. Priya Patel",    startTime: "14:00", endTime: "15:00", date: toYMD(addDays(_mon, 3)), status: "Arrived",      treatment: "Crown Fitting",           treatmentCategory: "Restorative"   }),
  mkApt({ id: 7, patientName: "Suresh Iyer",   doctor: "Dr. Michael Foster", startTime: "09:30", endTime: "10:30", date: toYMD(addDays(_mon, 4)), status: "Completed",    treatment: "Root Canal",              treatmentCategory: "Endodontics"   }),
  mkApt({ id: 8, patientName: "Divya Nair",    doctor: "Dr. Sarah Lee",      startTime: "16:00", endTime: "16:30", date: toYMD(addDays(_mon, 4)), status: "No-show",      treatment: "Scaling",                 treatmentCategory: "Preventive"    }),
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, name: "Stock check — dental supplies", center: "Speedwell Premium Division", assignedTo: "Admin Pooja",      date: toYMD(addDays(_mon, 2)), startTime: "08:30", endTime: "09:00", status: "New",        showOnCalendar: true, color: "#6366F1" },
  { id: 2, name: "Team briefing",                 center: "Speedwell Premium Division", assignedTo: "Dr. Anand Jasani", date: toYMD(addDays(_mon, 4)), startTime: "08:00", endTime: "08:30", status: "In Progress", showOnCalendar: true, color: "#6366F1" },
];

export const INITIAL_UNAVAILABILITY: DoctorUnavailability[] = [
  { id: 1, doctors: ["Dr. Priya Patel"], fromDate: toYMD(addDays(_mon, 3)), fromTime: "12:00", toDate: toYMD(addDays(_mon, 3)), toTime: "13:00", reason: "Lunch Break" },
];
