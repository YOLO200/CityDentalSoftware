import { Upload } from "lucide-react";
import { Input } from "../form/Input";
import { Textarea } from "../form/Textarea";
import { SectionCard } from "../form/SectionCard";
import type { PatientFormData, OnChange } from "./types";

interface DentalInfoSectionProps {
  formData: PatientFormData;
  onChange: OnChange;
}

export function DentalInfoSection({ formData, onChange }: DentalInfoSectionProps) {
  return (
    <SectionCard title="Dental Information">
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Referring Doctor"
          value={formData.referringDoctor}
          onChange={(e) => onChange("referringDoctor", e.target.value)}
          placeholder="Dr. Name"
        />
        <Input
          label="First Visit Date"
          type="date"
          value={formData.firstVisitDate}
          onChange={(e) => onChange("firstVisitDate", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Textarea
          label="Chief Complaint"
          value={formData.chiefComplaint}
          onChange={(e) => onChange("chiefComplaint", e.target.value)}
          placeholder="What is the main reason for the visit?"
        />
      </div>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <Input
          label="Previous Dentist"
          value={formData.previousDentist}
          onChange={(e) => onChange("previousDentist", e.target.value)}
          placeholder="Name of previous dentist"
        />
        <Input
          label="Last Dental Visit Date"
          type="date"
          value={formData.lastDentalVisit}
          onChange={(e) => onChange("lastDentalVisit", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Textarea
          label="Treatment Notes"
          value={formData.treatmentNotes}
          onChange={(e) => onChange("treatmentNotes", e.target.value)}
          placeholder="Any relevant treatment notes or history"
        />
      </div>
      <div className="mt-6">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
          <Upload className="h-4 w-4" />
          Upload Previous X-rays
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Accepted formats: JPEG, PNG, PDF (Max 10MB)
        </p>
      </div>
    </SectionCard>
  );
}
