export type AppointmentStatus =
  | "Scheduled" | "Confirmed" | "Arrived" | "In Waiting"
  | "In Treatment" | "Completed" | "Cancelled" | "No-show" | "Rescheduled";

export type AppointmentType  = "Regular" | "Walk-In" | "Group" | "Series";
export type TaskStatus       = "New" | "In Progress" | "Completed" | "Cancelled";
export type RepeatFreq       = "Daily" | "Weekly" | "Monthly";
export type TaskVisibility   = "all" | "assigned" | "doctors" | "operators";
export type ViewMode         = "day" | "week" | "month" | "doctor";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Appointment {
  id: number;
  appointmentType: AppointmentType;
  patientName: string;
  patientId: string;
  patientPhone: string;
  isNewPatient: boolean;
  doctor: string;
  doctorColor: string;
  treatment: string;
  treatmentCategory: string;
  center: string;
  operatory?: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM 24h
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  hasPendingPayment: boolean;
  cancelReason?: string;
  rescheduleReason?: string;
  isWalkIn?: boolean;
  groupId?: number;
  groupPatients?: Array<{ id: string; name: string }>;
  groupTitle?: string;
  seriesId?: number;
}

export interface Task {
  id: number;
  name: string;
  center: string;
  project?: string;
  assignedTo?: string;
  patientId?: string;
  patientName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  disallowAppointments?: boolean;
  dueDate?: string;
  dueTime?: string;
  status: TaskStatus;
  notes?: string;
  isRecurring?: boolean;
  repeatFrequency?: RepeatFreq;
  repeatUntil?: string;
  showOnCalendar?: boolean;
  color?: string;
}

export interface DoctorUnavailability {
  id: number;
  doctors: string[];
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  reason: string;
  description?: string;
}

export interface CalendarSettings {
  showTasksOnCalendar: boolean;
  taskColor: string;
  taskVisibility: TaskVisibility;
  filterProject?: string;
  filterAssignedUser?: string;
}
