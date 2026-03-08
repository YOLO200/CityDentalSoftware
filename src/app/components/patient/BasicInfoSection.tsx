import { Input } from "../form/Input";
import { Select } from "../form/Select";
import { Textarea } from "../form/Textarea";
import { SectionCard } from "../form/SectionCard";
import type { PatientFormData, FormErrors, OnChange } from "./types";

interface BasicInfoSectionProps {
  formData: PatientFormData;
  errors: FormErrors;
  onChange: OnChange;
}

export function BasicInfoSection({ formData, errors, onChange }: BasicInfoSectionProps) {
  return (
    <SectionCard title="Basic Information">
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="First Name"
          required
          value={formData.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
          error={errors.firstName}
          placeholder="Enter first name"
        />
        <Input
          label="Last Name"
          required
          value={formData.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          error={errors.lastName}
          placeholder="Enter last name"
        />
        <Select
          label="Gender"
          required
          value={formData.gender}
          onChange={(e) => onChange("gender", e.target.value)}
          error={errors.gender}
          options={[
            { value: "", label: "Select gender" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
        <Input
          label="Date of Birth"
          required
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => onChange("dateOfBirth", e.target.value)}
          error={errors.dateOfBirth}
        />
        <Input
          label="Age"
          value={formData.age}
          disabled
          placeholder="Auto-calculated"
        />
        <Input
          label="Phone Number"
          required
          value={formData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          error={errors.phone}
          placeholder="+91 98765-43210"
        />
        <Input
          label="Alternate Phone"
          value={formData.alternatePhone}
          onChange={(e) => onChange("alternatePhone", e.target.value)}
          placeholder="+91 98765-43210"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="patient@example.com"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Textarea
          label="Address"
          value={formData.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Street address, apartment, etc."
        />
      </div>
      <div className="grid grid-cols-3 gap-6 mt-6">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="City"
        />
        <Input
          label="State"
          value={formData.state}
          onChange={(e) => onChange("state", e.target.value)}
          placeholder="State"
        />
        <Input
          label="ZIP Code"
          value={formData.zipCode}
          onChange={(e) => onChange("zipCode", e.target.value)}
          placeholder="360001"
        />
      </div>
    </SectionCard>
  );
}
