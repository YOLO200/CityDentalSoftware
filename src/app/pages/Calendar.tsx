import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

interface Appointment {
  id: number;
  patientName: string;
  treatment: string;
  doctor: string;
  doctorColor: string;
  startTime: string;
  endTime: string;
  day: number; // 0 = Monday, 6 = Sunday
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

const doctors = [
  { name: "Dr. Anand Jasani", color: "#3B82F6", bgColor: "#EFF6FF" },
  { name: "Dr. Priya Patel", color: "#10B981", bgColor: "#F0FDF4" },
  { name: "Dr. Michael Foster", color: "#8B5CF6", bgColor: "#F5F3FF" },
  { name: "Dr. Sarah Lee", color: "#F59E0B", bgColor: "#FEF3C7" },
];

const appointments: Appointment[] = [
  {
    id: 1,
    patientName: "Rajesh Kumar",
    treatment: "Dental Cleaning",
    doctor: "Dr. Anand Jasani",
    doctorColor: "#3B82F6",
    startTime: "09:00",
    endTime: "09:30",
    day: 0,
    status: "Confirmed",
  },
  {
    id: 2,
    patientName: "Priya Sharma",
    treatment: "Root Canal",
    doctor: "Dr. Michael Foster",
    doctorColor: "#8B5CF6",
    startTime: "10:00",
    endTime: "11:00",
    day: 0,
    status: "Confirmed",
  },
  {
    id: 3,
    patientName: "Amit Singh",
    treatment: "Checkup",
    doctor: "Dr. Priya Patel",
    doctorColor: "#10B981",
    startTime: "13:00",
    endTime: "13:30",
    day: 1,
    status: "Confirmed",
  },
  {
    id: 4,
    patientName: "Neha Gupta",
    treatment: "Invisalign Review",
    doctor: "Dr. Sarah Lee",
    doctorColor: "#F59E0B",
    startTime: "15:30",
    endTime: "16:00",
    day: 1,
    status: "Pending",
  },
  {
    id: 5,
    patientName: "Vikram Reddy",
    treatment: "Teeth Whitening",
    doctor: "Dr. Anand Jasani",
    doctorColor: "#3B82F6",
    startTime: "11:00",
    endTime: "12:00",
    day: 2,
    status: "Confirmed",
  },
  {
    id: 6,
    patientName: "Anjali Mehta",
    treatment: "Crown Fitting",
    doctor: "Dr. Priya Patel",
    doctorColor: "#10B981",
    startTime: "14:00",
    endTime: "15:00",
    day: 3,
    status: "Confirmed",
  },
  {
    id: 7,
    patientName: "Suresh Iyer",
    treatment: "Emergency",
    doctor: "Dr. Michael Foster",
    doctorColor: "#8B5CF6",
    startTime: "09:30",
    endTime: "10:30",
    day: 4,
    status: "Completed",
  },
  {
    id: 8,
    patientName: "Divya Nair",
    treatment: "Consultation",
    doctor: "Dr. Sarah Lee",
    doctorColor: "#F59E0B",
    startTime: "16:00",
    endTime: "16:30",
    day: 4,
    status: "Confirmed",
  },
];

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function Calendar() {
  const [currentWeek] = useState("Feb 19 - Feb 25, 2026");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [visibleDoctors, setVisibleDoctors] = useState<string[]>(
    doctors.map((d) => d.name)
  );

  const toggleDoctor = (doctorName: string) => {
    if (visibleDoctors.includes(doctorName)) {
      setVisibleDoctors(visibleDoctors.filter((d) => d !== doctorName));
    } else {
      setVisibleDoctors([...visibleDoctors, doctorName]);
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    visibleDoctors.includes(apt.doctor)
  );

  const getAppointmentPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin - 8 * 60; // Offset from 8 AM
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    const top = (startMinutes / 30) * 48; // 48px per 30 min slot
    const height = (duration / 30) * 48;

    return { top, height };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl">Appointments</h1>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Appointment
          </button>
        </div>

        {/* Navigation & Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-border bg-card px-4 py-2 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{currentWeek}</span>
            <button className="rounded-xl border border-border bg-card px-4 py-2 hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary">
              Today
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("day")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                viewMode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              Month
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient or doctor..."
              className="w-64 rounded-xl border border-border bg-input-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Doctor Legend */}
        <div className="mb-6 flex items-center gap-6 rounded-2xl border border-border bg-card p-4">
          <span className="text-sm font-medium text-muted-foreground">
            Doctors:
          </span>
          {doctors.map((doctor) => (
            <button
              key={doctor.name}
              onClick={() => toggleDoctor(doctor.name)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                visibleDoctors.includes(doctor.name)
                  ? "bg-secondary"
                  : "opacity-50 hover:opacity-75"
              }`}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: doctor.color }}
              />
              <span className="text-sm">{doctor.name}</span>
            </button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Days Header */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-secondary">
                <div className="p-4"></div>
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">{day}</div>
                    <div className="mt-1 text-sm font-medium">{19 + index}</div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative">
                <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                  {/* Time Labels */}
                  <div>
                    {timeSlots.map((time, index) => (
                      <div
                        key={time}
                        className="h-12 border-b border-border px-4 py-2 text-xs text-muted-foreground"
                      >
                        {index % 2 === 0 ? time : ""}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {daysOfWeek.map((day, dayIndex) => (
                    <div key={day} className="relative border-l border-border">
                      {/* Time Slots Background */}
                      {timeSlots.map((time) => (
                        <div
                          key={time}
                          className="h-12 border-b border-border"
                        />
                      ))}

                      {/* Appointments */}
                      {filteredAppointments
                        .filter((apt) => apt.day === dayIndex)
                        .map((apt) => {
                          const { top, height } = getAppointmentPosition(
                            apt.startTime,
                            apt.endTime
                          );
                          return (
                            <div
                              key={apt.id}
                              className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-xl p-2 shadow-sm transition-all hover:shadow-md"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: apt.doctorColor + "1A",
                                borderLeft: `3px solid ${apt.doctorColor}`,
                              }}
                            >
                              <div className="text-xs font-medium text-foreground">
                                {apt.patientName}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {apt.treatment}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {apt.startTime} - {apt.endTime}
                              </div>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusColor(
                                    apt.status
                                  )}`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
