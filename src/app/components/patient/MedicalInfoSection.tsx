import { AlertCircle } from "lucide-react";
import { Input } from "../form/Input";
import { Select } from "../form/Select";
import { Textarea } from "../form/Textarea";
import { MultiSelect } from "../form/MultiSelect";
import { SectionCard } from "../form/SectionCard";
import { allergySuggestions } from "./types";
import type { PatientFormData, OnChange } from "./types";

interface MedicalInfoSectionProps {
  formData: PatientFormData;
  onChange: OnChange;
}

export function MedicalInfoSection({ formData, onChange }: MedicalInfoSectionProps) {
  return (
    <SectionCard title="Medical Information">
      <div className="grid grid-cols-2 gap-6">
        <Select
          label="Blood Group"
          value={formData.bloodGroup}
          onChange={(e) => onChange("bloodGroup", e.target.value)}
          options={[
            { value: "", label: "Select blood group" },
            { value: "A+", label: "A+" },
            { value: "A-", label: "A-" },
            { value: "B+", label: "B+" },
            { value: "B-", label: "B-" },
            { value: "AB+", label: "AB+" },
            { value: "AB-", label: "AB-" },
            { value: "O+", label: "O+" },
            { value: "O-", label: "O-" },
          ]}
        />
        <div className="col-span-2">
          <MultiSelect
            label="Allergies"
            value={formData.allergies}
            onChange={(value) => onChange("allergies", value)}
            suggestions={allergySuggestions}
            placeholder="Type allergy and press Enter"
          />
          {formData.allergies.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800 font-medium">
                Medical Alert: Patient has {formData.allergies.length} known{" "}
                {formData.allergies.length === 1 ? "allergy" : "allergies"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Textarea
          label="Existing Medical Conditions"
          value={formData.medicalConditions}
          onChange={(e) => onChange("medicalConditions", e.target.value)}
          placeholder="List any existing medical conditions (diabetes, hypertension, etc.)"
        />
        <Textarea
          label="Current Medications"
          value={formData.currentMedications}
          onChange={(e) => onChange("currentMedications", e.target.value)}
          placeholder="List current medications with dosage"
        />
      </div>
      <div className="grid grid-cols-2 gap-6 mt-6">
        {formData.gender === "female" && (
          <Select
            label="Pregnancy Status"
            value={formData.pregnancyStatus}
            onChange={(e) => onChange("pregnancyStatus", e.target.value)}
            options={[
              { value: "", label: "Select status" },
              { value: "not_pregnant", label: "Not Pregnant" },
              { value: "pregnant", label: "Pregnant" },
              { value: "not_applicable", label: "Not Applicable" },
            ]}
          />
        )}
        <Input
          label="Emergency Contact Name"
          value={formData.emergencyContactName}
          onChange={(e) => onChange("emergencyContactName", e.target.value)}
          placeholder="Full name"
        />
        <Input
          label="Emergency Contact Phone"
          value={formData.emergencyContactPhone}
          onChange={(e) => onChange("emergencyContactPhone", e.target.value)}
          placeholder="+91 98765-43210"
        />
      </div>
    </SectionCard>
  );
}
