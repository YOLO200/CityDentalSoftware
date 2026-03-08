import { Mail, Phone, MapPin, Calendar } from "lucide-react";

interface PersonalInfoCardProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function PersonalInfoCard({
  firstName,
  lastName,
  email,
  phone,
  address,
  dateOfBirth,
  gender,
  isEditing,
  onChange,
  onSave,
}: PersonalInfoCardProps) {
  const fieldClass =
    "rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
        Personal Information
      </h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              disabled
              className={`w-full ${fieldClass} pl-10`}
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
              value={phone}
              onChange={(e) => onChange("phone", e.target.value)}
              disabled={!isEditing}
              className={`w-full ${fieldClass} pl-10`}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-sm font-medium text-foreground">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={(e) => onChange("address", e.target.value)}
              disabled={!isEditing}
              className={`w-full ${fieldClass} pl-10`}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Date of Birth</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
              disabled={!isEditing}
              className={`w-full ${fieldClass} pl-10`}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Gender</label>
          <select
            value={gender}
            onChange={(e) => onChange("gender", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
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
            onClick={onSave}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
