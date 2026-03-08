import { Toggle } from "../form/Toggle";

interface Notifications {
  email: boolean;
  sms: boolean;
  appointments: boolean;
  systemUpdates: boolean;
}

interface NotificationPreferencesCardProps {
  notifications: Notifications;
  onChange: (field: keyof Notifications, checked: boolean) => void;
}

const preferences: { field: keyof Notifications; label: string; description: string }[] = [
  { field: "email", label: "Email Notifications", description: "Receive notifications via email" },
  { field: "sms", label: "SMS Notifications", description: "Receive notifications via SMS" },
  { field: "appointments", label: "Appointment Alerts", description: "Get reminders for upcoming appointments" },
  { field: "systemUpdates", label: "System Updates", description: "Stay informed about system updates and features" },
];

export function NotificationPreferencesCard({ notifications, onChange }: NotificationPreferencesCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
        Notification Preferences
      </h3>
      <div className="space-y-4">
        {preferences.map(({ field, label, description }, i) => (
          <div
            key={field}
            className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Toggle
              checked={notifications[field]}
              onChange={(checked) => onChange(field, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
