import { Clock } from "lucide-react";
import { Toggle } from "../form/Toggle";

export interface WorkingDay {
  day: string;
  isWorking: boolean;
  openingTime: string;
  breakStart: string;
  breakEnd: string;
  closingTime: string;
}

interface WorkingHoursCardProps {
  workingHours: WorkingDay[];
  specialWorkingHours1Enabled: boolean;
  specialWorkingHours2Enabled: boolean;
  onUpdateDay: (index: number, field: keyof WorkingDay, value: string | boolean) => void;
  onApplyToAll: (index: number) => void;
  onSave: () => void;
  onToggleSpecial1: (checked: boolean) => void;
  onToggleSpecial2: (checked: boolean) => void;
}

const timeInputClass =
  "w-36 rounded-xl border border-border bg-input-background px-3 py-2 pl-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

export function WorkingHoursCard({
  workingHours,
  specialWorkingHours1Enabled,
  specialWorkingHours2Enabled,
  onUpdateDay,
  onApplyToAll,
  onSave,
  onToggleSpecial1,
  onToggleSpecial2,
}: WorkingHoursCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-blue-100">
        <h3 className="text-lg font-semibold text-foreground">Special Working Hours</h3>
        <Clock className="h-5 w-5 text-primary" />
      </div>

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
                    onChange={(checked) => onUpdateDay(index, "isWorking", checked)}
                  />
                </td>
                {(["openingTime", "breakStart", "breakEnd", "closingTime"] as const).map((field) => (
                  <td key={field} className="px-4 py-4">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={day[field]}
                        onChange={(e) => onUpdateDay(index, field, e.target.value)}
                        disabled={!day.isWorking}
                        placeholder="H:MM AM/PM"
                        className={timeInputClass}
                      />
                    </div>
                  </td>
                ))}
                <td className="px-4 py-4">
                  <button
                    onClick={() => onApplyToAll(index)}
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

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Special Working Hours 1</p>
            <p className="text-xs text-muted-foreground">Configure special hours for holidays or events</p>
          </div>
          <Toggle checked={specialWorkingHours1Enabled} onChange={onToggleSpecial1} />
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Special Working Hours 2</p>
            <p className="text-xs text-muted-foreground">Configure additional special hours if needed</p>
          </div>
          <Toggle checked={specialWorkingHours2Enabled} onChange={onToggleSpecial2} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          className="rounded-xl bg-primary px-8 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          SAVE
        </button>
      </div>
    </div>
  );
}
