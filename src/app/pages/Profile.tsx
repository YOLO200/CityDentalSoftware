import { useState } from "react";
import { User, Camera, Mail, Phone, MapPin, Calendar, Lock, Shield, LogOut, Bell, Edit2, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Toggle } from "../components/form/Toggle";

interface WorkingDay {
  day: string;
  isWorking: boolean;
  openingTime: string;
  breakStart: string;
  breakEnd: string;
  closingTime: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data
  const [userData, setUserData] = useState({
    firstName: "Anand",
    lastName: "Jasani",
    email: "anand.jasani@citydentalcare.com",
    phone: "+91 98765-43210",
    address: "15, Shree Complex, Near Railway Station, Rajkot",
    dateOfBirth: "1985-06-15",
    gender: "male",
    role: "Doctor",
    specialization: "Orthodontist",
    licenseNumber: "DCI-GUJ-12345",
    experience: "12",
    clinicLocation: "Virani Chowk, Kothariya",
    consultationHours: "9:00 AM - 6:00 PM",
    accountCreated: "Jan 15, 2022",
    appointmentsToday: 8,
    assignedPatients: 147,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    appointments: true,
    systemUpdates: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
  });

  const [workingHours, setWorkingHours] = useState<WorkingDay[]>([
    { day: "Mon", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Tue", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Wed", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Thu", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Fri", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Sat", isWorking: true, openingTime: "10:00 AM", breakStart: "1:00 PM", breakEnd: "2:00 PM", closingTime: "7:00 PM" },
    { day: "Sun", isWorking: false, openingTime: "", breakStart: "", breakEnd: "", closingTime: "" },
  ]);

  const [specialWorkingHours1Enabled, setSpecialWorkingHours1Enabled] = useState(false);
  const [specialWorkingHours2Enabled, setSpecialWorkingHours2Enabled] = useState(false);

  const recentSessions = [
    {
      device: "Chrome on Windows",
      location: "Rajkot, Gujarat",
      time: "2 hours ago",
      current: true,
    },
    {
      device: "Safari on iPhone",
      location: "Rajkot, Gujarat",
      time: "Yesterday at 6:30 PM",
      current: false,
    },
    {
      device: "Chrome on Windows",
      location: "Rajkot, Gujarat",
      time: "2 days ago",
      current: false,
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/login");
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would save the data
    console.log("Saving profile data:", userData);
  };

  const updateWorkingDay = (index: number, field: keyof WorkingDay, value: any) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours[index] = { ...newWorkingHours[index], [field]: value };
    setWorkingHours(newWorkingHours);
  };

  const applyToAll = (index: number) => {
    const sourceDay = workingHours[index];
    const newWorkingHours = workingHours.map((day) => 
      day.isWorking ? {
        ...day,
        openingTime: sourceDay.openingTime,
        breakStart: sourceDay.breakStart,
        breakEnd: sourceDay.breakEnd,
        closingTime: sourceDay.closingTime,
      } : day
    );
    setWorkingHours(newWorkingHours);
  };

  const handleSaveWorkingHours = () => {
    console.log("Saving working hours:", workingHours);
    // Here you would save the working hours data
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-foreground mb-2">Confirm Logout</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-xl bg-destructive px-6 py-2.5 text-sm text-white hover:bg-destructive/90 transition-colors"
              >
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
            {/* Profile Overview Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
              <div className="flex items-start justify-between">
                {/* Left Side */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
                      {userData.firstName[0]}{userData.lastName[0]}
                    </div>
                    <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Dr. {userData.firstName} {userData.lastName}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {userData.role}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Quick Stats */}
                <div className="flex flex-col items-end gap-4">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                  </button>
                  <div className="grid grid-cols-2 gap-6 text-right">
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{userData.appointmentsToday}</p>
                      <p className="text-xs text-muted-foreground">Appointments Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{userData.assignedPatients}</p>
                      <p className="text-xs text-muted-foreground">Assigned Patients</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Member since {userData.accountCreated}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input
                    type="text"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 pl-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 pl-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={userData.address}
                      onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 pl-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={userData.dateOfBirth}
                      onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-border bg-input-background px-4 py-2.5 pl-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  <select
                    value={userData.gender}
                    onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Professional Information Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-foreground">Professional Information</h3>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {userData.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Specialization</label>
                  <input
                    type="text"
                    value={userData.specialization}
                    onChange={(e) => setUserData({ ...userData, specialization: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">License Number</label>
                  <input
                    type="text"
                    value={userData.licenseNumber}
                    disabled
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Years of Experience</label>
                  <input
                    type="text"
                    value={userData.experience}
                    onChange={(e) => setUserData({ ...userData, experience: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Clinic Location(s)</label>
                  <input
                    type="text"
                    value={userData.clinicLocation}
                    onChange={(e) => setUserData({ ...userData, clinicLocation: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-sm font-medium text-foreground">Consultation Hours</label>
                  <input
                    type="text"
                    value={userData.consultationHours}
                    onChange={(e) => setUserData({ ...userData, consultationHours: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Your regular consultation hours at the clinic</p>
                </div>
              </div>
              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Working Hours Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-foreground">Special Working Hours</h3>
                <Clock className="h-5 w-5 text-primary" />
              </div>
              
              {/* Working Hours Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Day</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Working</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Opening Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Break Start</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Break End</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Closing Time</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingHours.map((day, index) => (
                      <tr key={day.day} className="border-b border-border">
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-foreground">{day.day}</span>
                        </td>
                        <td className="px-4 py-4">
                          <Toggle
                            checked={day.isWorking}
                            onChange={(checked) => updateWorkingDay(index, "isWorking", checked)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={day.openingTime}
                              onChange={(e) => updateWorkingDay(index, "openingTime", e.target.value)}
                              disabled={!day.isWorking}
                              placeholder="H:MM AM/PM"
                              className="w-36 rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={day.breakStart}
                              onChange={(e) => updateWorkingDay(index, "breakStart", e.target.value)}
                              disabled={!day.isWorking}
                              placeholder="H:MM AM/PM"
                              className="w-36 rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={day.breakEnd}
                              onChange={(e) => updateWorkingDay(index, "breakEnd", e.target.value)}
                              disabled={!day.isWorking}
                              placeholder="H:MM AM/PM"
                              className="w-36 rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={day.closingTime}
                              onChange={(e) => updateWorkingDay(index, "closingTime", e.target.value)}
                              disabled={!day.isWorking}
                              placeholder="H:MM AM/PM"
                              className="w-36 rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
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

              {/* Special Working Hours Sections */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Special Working Hours 1</p>
                    <p className="text-xs text-muted-foreground">Configure special hours for holidays or events</p>
                  </div>
                  <Toggle
                    checked={specialWorkingHours1Enabled}
                    onChange={setSpecialWorkingHours1Enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Special Working Hours 2</p>
                    <p className="text-xs text-muted-foreground">Configure additional special hours if needed</p>
                  </div>
                  <Toggle
                    checked={specialWorkingHours2Enabled}
                    onChange={setSpecialWorkingHours2Enabled}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveWorkingHours}
                  className="rounded-xl bg-primary px-8 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  SAVE
                </button>
              </div>
            </div>

            {/* Account & Security Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
                Account & Security
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update your password regularly for security</p>
                  </div>
                  <button className="rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </button>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Toggle
                      checked={security.twoFactorAuth}
                      onChange={(checked) => setSecurity({ ...security, twoFactorAuth: checked })}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Recent Session Activity</p>
                      <p className="text-xs text-muted-foreground">Your recent login sessions</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{session.device}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.location} • {session.time}
                            </p>
                          </div>
                        </div>
                        {session.current && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Current Session
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-destructive hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout from Account
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Preferences Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Toggle
                    checked={notifications.email}
                    onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Toggle
                    checked={notifications.sms}
                    onChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Appointment Alerts</p>
                    <p className="text-xs text-muted-foreground">Get reminders for upcoming appointments</p>
                  </div>
                  <Toggle
                    checked={notifications.appointments}
                    onChange={(checked) => setNotifications({ ...notifications, appointments: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">System Updates</p>
                    <p className="text-xs text-muted-foreground">Stay informed about system updates and features</p>
                  </div>
                  <Toggle
                    checked={notifications.systemUpdates}
                    onChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}