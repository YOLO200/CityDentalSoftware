import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, AlertCircle, Upload } from "lucide-react";
import { Input } from "../components/form/Input";
import { Select } from "../components/form/Select";
import { Textarea } from "../components/form/Textarea";
import { Checkbox } from "../components/form/Checkbox";
import { Toggle } from "../components/form/Toggle";
import { MultiSelect } from "../components/form/MultiSelect";
import { SectionCard } from "../components/form/SectionCard";

interface FormData {
  // Basic Information
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Medical Information
  bloodGroup: string;
  allergies: string[];
  medicalConditions: string;
  currentMedications: string;
  pregnancyStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Dental Information
  referringDoctor: string;
  firstVisitDate: string;
  chiefComplaint: string;
  previousDentist: string;
  lastDentalVisit: string;
  treatmentNotes: string;

  // Insurance & Billing
  insuranceProvider: string;
  policyNumber: string;
  coveragePercentage: string;
  billingNotes: string;
  paymentMethod: string;

  // Communication Preferences
  smsReminders: boolean;
  emailReminders: boolean;
  whatsappNotifications: boolean;
  activePatient: boolean;
}

const allergySuggestions = [
  "Penicillin",
  "Latex",
  "Lidocaine",
  "Epinephrine",
  "Aspirin",
  "Ibuprofen",
  "Codeine",
  "Sulfa drugs",
];

export function AddPatient() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    phone: "",
    alternatePhone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bloodGroup: "",
    allergies: [],
    medicalConditions: "",
    currentMedications: "",
    pregnancyStatus: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    referringDoctor: "",
    firstVisitDate: new Date().toISOString().split("T")[0],
    chiefComplaint: "",
    previousDentist: "",
    lastDentalVisit: "",
    treatmentNotes: "",
    insuranceProvider: "",
    policyNumber: "",
    coveragePercentage: "",
    billingNotes: "",
    paymentMethod: "",
    smsReminders: true,
    emailReminders: true,
    whatsappNotifications: true,
    activePatient: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate age when DOB changes
      if (field === "dateOfBirth") {
        updated.age = calculateAge(value);
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required field validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    // Phone validation
    if (formData.phone && !/^\+91\s\d{5}-\d{5}$/.test(formData.phone)) {
      newErrors.phone = "Please enter valid phone format: +91 98765-43210";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      console.log("Saving patient:", formData);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate("/patients");
      }, 2000);
    }
  };

  const handleSaveAndAddAppointment = () => {
    if (validateForm()) {
      console.log("Saving patient and adding appointment:", formData);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate("/calendar");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-green-600 px-6 py-3 text-white shadow-lg animate-in slide-in-from-top">
          ✓ Patient successfully added
        </div>
      )}

      <div className="p-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <button onClick={() => navigate("/patients")} className="hover:text-foreground transition-colors">
                Patients
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Add New Patient</span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold text-foreground">Add New Patient</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/patients")}
                  className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Save Patient
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <SectionCard title="Basic Information">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  error={errors.firstName}
                  placeholder="Enter first name"
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  error={errors.lastName}
                  placeholder="Enter last name"
                />
                <Select
                  label="Gender"
                  required
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
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
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
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
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+91 98765-43210"
                />
                <Input
                  label="Alternate Phone"
                  value={formData.alternatePhone}
                  onChange={(e) => handleInputChange("alternatePhone", e.target.value)}
                  placeholder="+91 98765-43210"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="patient@example.com"
                />
              </div>
              <div className="grid grid-cols-1 gap-6 mt-6">
                <Textarea
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street address, apartment, etc."
                />
              </div>
              <div className="grid grid-cols-3 gap-6 mt-6">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="State"
                />
                <Input
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="360001"
                />
              </div>
            </SectionCard>

            {/* Medical Information */}
            <SectionCard title="Medical Information">
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Blood Group"
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
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
                    onChange={(value) => handleInputChange("allergies", value)}
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
                  onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                  placeholder="List any existing medical conditions (diabetes, hypertension, etc.)"
                />
                <Textarea
                  label="Current Medications"
                  value={formData.currentMedications}
                  onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                  placeholder="List current medications with dosage"
                />
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6">
                {formData.gender === "female" && (
                  <Select
                    label="Pregnancy Status"
                    value={formData.pregnancyStatus}
                    onChange={(e) => handleInputChange("pregnancyStatus", e.target.value)}
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
                  onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Emergency Contact Phone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                  placeholder="+91 98765-43210"
                />
              </div>
            </SectionCard>

            {/* Dental Information */}
            <SectionCard title="Dental Information">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Referring Doctor"
                  value={formData.referringDoctor}
                  onChange={(e) => handleInputChange("referringDoctor", e.target.value)}
                  placeholder="Dr. Name"
                />
                <Input
                  label="First Visit Date"
                  type="date"
                  value={formData.firstVisitDate}
                  onChange={(e) => handleInputChange("firstVisitDate", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 mt-6">
                <Textarea
                  label="Chief Complaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                  placeholder="What is the main reason for the visit?"
                />
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6">
                <Input
                  label="Previous Dentist"
                  value={formData.previousDentist}
                  onChange={(e) => handleInputChange("previousDentist", e.target.value)}
                  placeholder="Name of previous dentist"
                />
                <Input
                  label="Last Dental Visit Date"
                  type="date"
                  value={formData.lastDentalVisit}
                  onChange={(e) => handleInputChange("lastDentalVisit", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 mt-6">
                <Textarea
                  label="Treatment Notes"
                  value={formData.treatmentNotes}
                  onChange={(e) => handleInputChange("treatmentNotes", e.target.value)}
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

            {/* Insurance & Billing */}
            <SectionCard title="Insurance & Billing">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Insurance Provider"
                  value={formData.insuranceProvider}
                  onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                  placeholder="Provider name"
                />
                <Input
                  label="Policy Number"
                  value={formData.policyNumber}
                  onChange={(e) => handleInputChange("policyNumber", e.target.value)}
                  placeholder="Policy number"
                />
                <Input
                  label="Coverage %"
                  type="number"
                  value={formData.coveragePercentage}
                  onChange={(e) => handleInputChange("coveragePercentage", e.target.value)}
                  placeholder="80"
                  min="0"
                  max="100"
                />
                <Select
                  label="Preferred Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
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
                  onChange={(e) => handleInputChange("billingNotes", e.target.value)}
                  placeholder="Any special billing instructions or notes"
                />
              </div>
            </SectionCard>

            {/* Communication Preferences */}
            <SectionCard title="Communication Preferences">
              <div className="space-y-4">
                <Checkbox
                  label="SMS Reminders"
                  checked={formData.smsReminders}
                  onChange={(e) => handleInputChange("smsReminders", e.target.checked)}
                />
                <Checkbox
                  label="Email Reminders"
                  checked={formData.emailReminders}
                  onChange={(e) => handleInputChange("emailReminders", e.target.checked)}
                />
                <Checkbox
                  label="WhatsApp Notifications"
                  checked={formData.whatsappNotifications}
                  onChange={(e) => handleInputChange("whatsappNotifications", e.target.checked)}
                />
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <Toggle
                  label="Active Patient"
                  checked={formData.activePatient}
                  onChange={(checked) => handleInputChange("activePatient", checked)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Inactive patients won't appear in appointment scheduling
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 mt-8 border-t border-border bg-card/95 backdrop-blur-sm py-4 -mx-8 px-8">
            <div className="mx-auto max-w-5xl flex items-center justify-between">
              <button
                onClick={() => navigate("/patients")}
                className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndAddAppointment}
                  className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  Save & Add Appointment
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Save Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
