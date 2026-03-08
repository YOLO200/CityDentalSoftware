interface ProfessionalInfoCardProps {
  specialization: string;
  licenseNumber: string;
  experience: string;
  clinicLocation: string;
  consultationHours: string;
  role: string;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function ProfessionalInfoCard({
  specialization,
  licenseNumber,
  experience,
  clinicLocation,
  consultationHours,
  role,
  isEditing,
  onChange,
  onSave,
}: ProfessionalInfoCardProps) {
  const fieldClass =
    "rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-blue-100">
        <h3 className="text-lg font-semibold text-foreground">Professional Information</h3>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {role}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Specialization</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => onChange("specialization", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">License Number</label>
          <input
            type="text"
            value={licenseNumber}
            disabled
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Years of Experience</label>
          <input
            type="text"
            value={experience}
            onChange={(e) => onChange("experience", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Clinic Location(s)</label>
          <input
            type="text"
            value={clinicLocation}
            onChange={(e) => onChange("clinicLocation", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-sm font-medium text-foreground">Consultation Hours</label>
          <input
            type="text"
            value={consultationHours}
            onChange={(e) => onChange("consultationHours", e.target.value)}
            disabled={!isEditing}
            className={fieldClass}
          />
          <p className="text-xs text-muted-foreground">Your regular consultation hours at the clinic</p>
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
