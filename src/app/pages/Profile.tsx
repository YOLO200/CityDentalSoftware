import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { ProfileOverviewCard } from "../components/profile/ProfileOverviewCard";
import { PersonalInfoCard } from "../components/profile/PersonalInfoCard";
import { ProfessionalInfoCard } from "../components/profile/ProfessionalInfoCard";
import { WorkingHoursCard, type WorkingDay } from "../components/profile/WorkingHoursCard";
import { AccountSecurityCard } from "../components/profile/AccountSecurityCard";
import { NotificationPreferencesCard } from "../components/profile/NotificationPreferencesCard";

const recentSessions = [
  { device: "Chrome on Windows", location: "Rajkot, Gujarat", time: "2 hours ago", current: true },
  { device: "Safari on iPhone", location: "Rajkot, Gujarat", time: "Yesterday at 6:30 PM", current: false },
  { device: "Chrome on Windows", location: "Rajkot, Gujarat", time: "2 days ago", current: false },
];

const defaultWorkingHours: WorkingDay[] = [
  { day: "Mon", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Tue", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Wed", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Thu", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Fri", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Sat", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
  { day: "Sun", isWorking: false, openingTime: "", breakStart: "", breakEnd: "", closingTime: "" },
];

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  role: string;
  specialization: string;
  licenseNumber: string;
  experience: string;
  clinicLocation: string;
  consultationHours: string;
  accountCreated: string;
  appointmentsToday: number;
  assignedPatients: number;
}

const defaultUserData: UserData = {
  firstName: "", lastName: "", email: "", phone: "", address: "",
  dateOfBirth: "", gender: "male", role: "Doctor", specialization: "",
  licenseNumber: "", experience: "", clinicLocation: "", consultationHours: "",
  accountCreated: "", appointmentsToday: 0, assignedPatients: 0,
};

export function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [notifications, setNotifications] = useState({
    email: true, sms: true, appointments: true, systemUpdates: false,
  });
  const [security, setSecurity] = useState({ twoFactorAuth: false });
  const [workingHours, setWorkingHours] = useState<WorkingDay[]>(defaultWorkingHours);
  const [specialWorkingHours1Enabled, setSpecialWorkingHours1Enabled] = useState(false);
  const [specialWorkingHours2Enabled, setSpecialWorkingHours2Enabled] = useState(false);

  // Fetch profile from Supabase on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const nameParts = (data.name as string || "").trim().split(" ");
        setUserData({
          firstName: nameParts[0] ?? "",
          lastName: nameParts.slice(1).join(" "),
          email: user.email,
          phone: (data.phone as string) ?? "",
          address: (data.address as string) ?? "",
          dateOfBirth: (data.date_of_birth as string) ?? "",
          gender: (data.gender as string) ?? "male",
          role: (data.role as string) ?? "Doctor",
          specialization: (data.specialization as string) ?? "",
          licenseNumber: (data.license_number as string) ?? "",
          experience: data.experience_years != null ? String(data.experience_years) : "",
          clinicLocation: (data.clinic_location as string) ?? "",
          consultationHours: (data.consultation_hours as string) ?? "",
          accountCreated: new Date(data.created_at as string).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
          appointmentsToday: 0,
          assignedPatients: 0,
        });
      });
  }, [user]);

  const handleFieldChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await supabase.from("profiles").update({
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      phone: userData.phone || null,
      address: userData.address || null,
      date_of_birth: userData.dateOfBirth || null,
      gender: userData.gender || null,
      role: userData.role || null,
      specialization: userData.specialization || null,
      license_number: userData.licenseNumber || null,
      experience_years: userData.experience ? parseInt(userData.experience) : null,
      clinic_location: userData.clinicLocation || null,
      consultation_hours: userData.consultationHours || null,
    }).eq("id", user.id);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleSaveWorkingHours = async () => {
    if (!user) return;
    const rows = workingHours.map((day, index) => ({
      doctor_id: user.id,
      day_of_week: index,
      is_working: day.isWorking,
      opening_time: day.openingTime || null,
      break_start: day.breakStart || null,
      break_end: day.breakEnd || null,
      closing_time: day.closingTime || null,
    }));
    await supabase.from("working_hours").upsert(rows, { onConflict: "doctor_id,day_of_week" });
  };

  const updateWorkingDay = (index: number, field: keyof WorkingDay, value: string | boolean) => {
    setWorkingHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const applyToAll = (index: number) => {
    const source = workingHours[index];
    setWorkingHours((prev) =>
      prev.map((day) =>
        day.isWorking
          ? { ...day, openingTime: source.openingTime, breakStart: source.breakStart, breakEnd: source.breakEnd, closingTime: source.closingTime }
          : day
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-foreground mb-2">Confirm Logout</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to logout from your account?</p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowLogoutModal(false); logout(); }}
                className="rounded-xl bg-destructive px-6 py-2.5 text-sm text-white hover:bg-destructive/90 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold text-foreground mb-8">My Profile</h1>
          <div className="space-y-6">
            <ProfileOverviewCard
              firstName={userData.firstName}
              lastName={userData.lastName}
              role={userData.role}
              appointmentsToday={userData.appointmentsToday}
              assignedPatients={userData.assignedPatients}
              accountCreated={userData.accountCreated}
              isEditing={isEditing}
              onToggleEdit={() => setIsEditing((e) => !e)}
            />
            <PersonalInfoCard
              firstName={userData.firstName}
              lastName={userData.lastName}
              email={userData.email}
              phone={userData.phone}
              address={userData.address}
              dateOfBirth={userData.dateOfBirth}
              gender={userData.gender}
              isEditing={isEditing}
              onChange={handleFieldChange}
              onSave={handleSave}
            />
            <ProfessionalInfoCard
              specialization={userData.specialization}
              licenseNumber={userData.licenseNumber}
              experience={userData.experience}
              clinicLocation={userData.clinicLocation}
              consultationHours={userData.consultationHours}
              role={userData.role}
              isEditing={isEditing}
              onChange={handleFieldChange}
              onSave={handleSave}
            />
            <WorkingHoursCard
              workingHours={workingHours}
              specialWorkingHours1Enabled={specialWorkingHours1Enabled}
              specialWorkingHours2Enabled={specialWorkingHours2Enabled}
              onUpdateDay={updateWorkingDay}
              onApplyToAll={applyToAll}
              onSave={handleSaveWorkingHours}
              onToggleSpecial1={setSpecialWorkingHours1Enabled}
              onToggleSpecial2={setSpecialWorkingHours2Enabled}
            />
            <AccountSecurityCard
              twoFactorAuth={security.twoFactorAuth}
              recentSessions={recentSessions}
              onToggle2FA={(checked) => setSecurity({ twoFactorAuth: checked })}
              onLogout={() => setShowLogoutModal(true)}
            />
            <NotificationPreferencesCard
              notifications={notifications}
              onChange={(field, checked) => setNotifications((prev) => ({ ...prev, [field]: checked }))}
            />
          </div>
          {isSaving && (
            <div className="fixed bottom-6 right-6 rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg">
              Saving…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
