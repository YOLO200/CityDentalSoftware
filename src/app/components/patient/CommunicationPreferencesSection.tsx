import { Checkbox } from "../form/Checkbox";
import { Toggle } from "../form/Toggle";
import { SectionCard } from "../form/SectionCard";
import type { PatientFormData, OnChange } from "./types";

interface CommunicationPreferencesSectionProps {
  formData: PatientFormData;
  onChange: OnChange;
}

export function CommunicationPreferencesSection({ formData, onChange }: CommunicationPreferencesSectionProps) {
  return (
    <SectionCard title="Communication Preferences">
      <div className="space-y-4">
        <Checkbox
          label="SMS Reminders"
          checked={formData.smsReminders}
          onChange={(e) => onChange("smsReminders", e.target.checked)}
        />
        <Checkbox
          label="Email Reminders"
          checked={formData.emailReminders}
          onChange={(e) => onChange("emailReminders", e.target.checked)}
        />
        <Checkbox
          label="WhatsApp Notifications"
          checked={formData.whatsappNotifications}
          onChange={(e) => onChange("whatsappNotifications", e.target.checked)}
        />
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <Toggle
          label="Active Patient"
          checked={formData.activePatient}
          onChange={(checked) => onChange("activePatient", checked)}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Inactive patients won't appear in appointment scheduling
        </p>
      </div>
    </SectionCard>
  );
}
