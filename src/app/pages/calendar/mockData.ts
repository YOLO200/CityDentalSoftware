// Static reference lists for the Calendar's New modal.
//
// Everything that has a table behind it was removed when the Calendar was wired
// to Supabase: doctors come from `profiles`, patients from `patients`, centres
// from `branches`, and appointments/tasks/unavailability from their own tables
// via ./data.ts. What remains is vocabulary with no DB representation.

// ── Reference data ────────────────────────────────────────────────────────────
export const CENTERS = [
  { id: "speedwell",  name: "Speedwell Premium Division", hours: { open: "09:00", close: "18:00" } },
  { id: "virani",    name: "Virani Chowk",               hours: { open: "09:00", close: "19:00" } },
  { id: "kothariya", name: "Kothariya",                  hours: { open: "10:00", close: "17:00" } },
];

// Chair-side assistants. No table behind this yet.
export const OPERATORS = ["Nurse Rekha", "Nurse Meera", "Nurse Divya", "Assistant Kiran"];

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

// Support staff only. Doctors are real `profiles` rows and are merged into the
// "Assigned To" dropdown at render time — listing them here too would produce
// duplicates and names that resolve to no profile id.
export const SUPPORT_STAFF = [
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

// Mirrors the appointment_status_type enum (migration 011), all 10 values.
export const ALL_STATUSES = [
  "Scheduled", "Confirmed", "Pending", "Arrived", "In Waiting",
  "In Treatment", "Completed", "Cancelled", "No-show", "Rescheduled",
] as const;

export const CANCEL_REASONS = [
  "Patient request", "Doctor unavailable", "Emergency",
  "Duplicate booking", "Patient rescheduled", "Other",
];

export const UNAVAILABILITY_REASONS = [
  "Leave", "Lunch Break", "Emergency", "Surgery", "Meeting", "Training", "Personal", "Other",
];
