import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Toggle } from "../components/form/Toggle";
import { type WorkingDay } from "../components/profile/WorkingHoursCard";

const defaultWorkingHours: WorkingDay[] = [
  { day: "Mon", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Tue", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Wed", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Thu", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Fri", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Sat", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Sun", isWorking: false, openingTime: "", breakStart: "", breakEnd: "", closingTime: "" },
];

const STEPS = ["Personal Info", "Professional Info", "Working Hours"];

export function SetupProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 1 — Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");

  // Step 2 — Professional Info
  const [role, setRole] = useState("Doctor");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [consultationHours, setConsultationHours] = useState("");

  // Step 3 — Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingDay[]>(defaultWorkingHours);

  // Pre-populate name and phone from signup metadata
  useEffect(() => {
    if (!user) return;
    const nameParts = (user.name ?? "").trim().split(" ");
    setFirstName(nameParts[0] ?? "");
    setLastName(nameParts.slice(1).join(" "));
    setPhone(user.phone ?? "");
  }, [user]);

  const updateWorkingDay = (index: number, field: keyof WorkingDay, value: string | boolean) => {
    setWorkingHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const applyToAll = (sourceIndex: number) => {
    const source = workingHours[sourceIndex];
    setWorkingHours((prev) =>
      prev.map((day) =>
        day.isWorking
          ? { ...day, openingTime: source.openingTime, breakStart: source.breakStart, breakEnd: source.breakEnd, closingTime: source.closingTime }
          : day
      )
    );
  };

  const handleNext = () => {
    if (step === 1 && !firstName.trim()) {
      setStepError("First name is required.");
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);

    const { error: profileError } = await supabase.from("profiles").update({
      name: `${firstName} ${lastName}`.trim(),
      phone: phone || null,
      address: address || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      role: role || null,
      specialization: specialization || null,
      license_number: licenseNumber || null,
      experience_years: experience ? parseInt(experience) : null,
      clinic_location: clinicLocation || null,
      consultation_hours: consultationHours || null,
      profile_complete: true,
    }).eq("id", user.id);

    if (profileError) {
      setSaveError(profileError.message);
      setIsSaving(false);
      return;
    }

    const workingHoursRows = workingHours.map((day, index) => ({
      doctor_id: user.id,
      day_of_week: index,
      is_working: day.isWorking,
      opening_time: day.openingTime || null,
      break_start: day.breakStart || null,
      break_end: day.breakEnd || null,
      closing_time: day.closingTime || null,
    }));

    const { error: hoursError } = await supabase
      .from("working_hours")
      .upsert(workingHoursRows, { onConflict: "doctor_id,day_of_week" });

    if (hoursError) {
      setSaveError(hoursError.message);
      setIsSaving(false);
      return;
    }

    navigate("/", { replace: true });
  };

  const fieldClass =
    "w-full rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const timeInputClass =
    "w-full rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            CD
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your details before you get started
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isDone || isActive
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-border text-muted-foreground"
                    }`}
                  >
                    {isDone ? "✓" : stepNum}
                  </div>
                  <span
                    className={`mt-1.5 text-xs whitespace-nowrap ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-4 mb-5 h-px w-24 transition-colors ${
                      stepNum < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setStepError(null); }}
                    placeholder="John"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className={`${fieldClass} opacity-60 cursor-not-allowed`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765-43210"
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123, Street Name, City"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Info */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">
                Professional Information
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Orthodontist"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">License Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MH-DEN-12345"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Clinic Location</label>
                  <input
                    type="text"
                    value={clinicLocation}
                    onChange={(e) => setClinicLocation(e.target.value)}
                    placeholder="e.g. City Dental, Rajkot"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Consultation Hours</label>
                  <input
                    type="text"
                    value={consultationHours}
                    onChange={(e) => setConsultationHours(e.target.value)}
                    placeholder="e.g. 10 AM – 7 PM"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Working Hours */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">
                Working Hours
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Day</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Working</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Opening</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Break Start</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Break End</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-foreground">Closing</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingHours.map((day, index) => (
                      <tr key={day.day} className="border-b border-border">
                        <td className="px-3 py-3">
                          <span className="text-sm font-medium text-foreground">{day.day}</span>
                        </td>
                        <td className="px-3 py-3">
                          <Toggle
                            checked={day.isWorking}
                            onChange={(checked) => updateWorkingDay(index, "isWorking", checked)}
                          />
                        </td>
                        {(["openingTime", "breakStart", "breakEnd", "closingTime"] as const).map((field) => (
                          <td key={field} className="px-3 py-3">
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                value={day[field]}
                                onChange={(e) => updateWorkingDay(index, field, e.target.value)}
                                disabled={!day.isWorking}
                                placeholder="H:MM AM/PM"
                                className={timeInputClass}
                              />
                            </div>
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => applyToAll(index)}
                            disabled={!day.isWorking}
                            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply All
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {saveError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>
          )}

          {/* Step validation error */}
          {stepError && (
            <p className="mt-4 text-sm text-red-600">{stepError}</p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => { setStepError(null); setStep((s) => s - 1); }}
              disabled={step === 1}
              className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Complete Setup"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 City Dental Software. All rights reserved.
        </p>
      </div>
    </div>
  );
}
