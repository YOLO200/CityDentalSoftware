import { Camera, Edit2 } from "lucide-react";

interface ProfileOverviewCardProps {
  firstName: string;
  lastName: string;
  role: string;
  appointmentsToday: number;
  assignedPatients: number;
  accountCreated: string;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function ProfileOverviewCard({
  firstName,
  lastName,
  role,
  appointmentsToday,
  assignedPatients,
  accountCreated,
  isEditing,
  onToggleEdit,
}: ProfileOverviewCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
              {firstName[0]}{lastName[0]}
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Dr. {firstName} {lastName}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {role}
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <button
            onClick={onToggleEdit}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
          <div className="grid grid-cols-2 gap-6 text-right">
            <div>
              <p className="text-2xl font-semibold text-foreground">{appointmentsToday}</p>
              <p className="text-xs text-muted-foreground">Appointments Today</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{assignedPatients}</p>
              <p className="text-xs text-muted-foreground">Assigned Patients</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Member since {accountCreated}</p>
        </div>
      </div>
    </div>
  );
}
