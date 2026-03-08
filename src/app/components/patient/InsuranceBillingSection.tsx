import { Input } from "../form/Input";
import { Select } from "../form/Select";
import { Textarea } from "../form/Textarea";
import { SectionCard } from "../form/SectionCard";
import type { PatientFormData, OnChange } from "./types";

interface InsuranceBillingSectionProps {
  formData: PatientFormData;
  onChange: OnChange;
}

export function InsuranceBillingSection({ formData, onChange }: InsuranceBillingSectionProps) {
  return (
    <SectionCard title="Insurance & Billing">
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Insurance Provider"
          value={formData.insuranceProvider}
          onChange={(e) => onChange("insuranceProvider", e.target.value)}
          placeholder="Provider name"
        />
        <Input
          label="Policy Number"
          value={formData.policyNumber}
          onChange={(e) => onChange("policyNumber", e.target.value)}
          placeholder="Policy number"
        />
        <Input
          label="Coverage %"
          type="number"
          value={formData.coveragePercentage}
          onChange={(e) => onChange("coveragePercentage", e.target.value)}
          placeholder="80"
          min="0"
          max="100"
        />
        <Select
          label="Preferred Payment Method"
          value={formData.paymentMethod}
          onChange={(e) => onChange("paymentMethod", e.target.value)}
          options={[
            { value: "", label: "Select method" },
            { value: "cash", label: "Cash" },
            { value: "card", label: "Card" },
            { value: "upi", label: "UPI" },
            { value: "netbanking", label: "Net Banking" },
            { value: "insurance", label: "Insurance" },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Textarea
          label="Billing Notes"
          value={formData.billingNotes}
          onChange={(e) => onChange("billingNotes", e.target.value)}
          placeholder="Any special billing instructions or notes"
        />
      </div>
    </SectionCard>
  );
}
