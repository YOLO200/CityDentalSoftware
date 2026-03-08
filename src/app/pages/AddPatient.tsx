import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { BasicInfoSection } from "../components/patient/BasicInfoSection";
import { MedicalInfoSection } from "../components/patient/MedicalInfoSection";
import { DentalInfoSection } from "../components/patient/DentalInfoSection";
import { InsuranceBillingSection } from "../components/patient/InsuranceBillingSection";
import { CommunicationPreferencesSection } from "../components/patient/CommunicationPreferencesSection";
import type { PatientFormData, FormValue, FormErrors } from "../components/patient/types";

const initialFormData: PatientFormData = {
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
};

function calculateAge(dob: string): string {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
}

export function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof PatientFormData, value: FormValue) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "dateOfBirth" && typeof value === "string") {
        updated.age = calculateAge(value);
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (formData.phone && !/^\+91\s\d{5}-\d{5}$/.test(formData.phone)) {
      newErrors.phone = "Please enter valid phone format: +91 98765-43210";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveAndNavigate = async (destination: string) => {
    if (!validateForm()) return;
    setSaveError(null);

    // Enum fields must be null when empty (Supabase rejects empty strings for enums)
    const { error } = await supabase.from("patients").insert({
      created_by: user?.id ?? null,
      first_name: formData.firstName,
      last_name: formData.lastName,
      gender: formData.gender || null,
      date_of_birth: formData.dateOfBirth || null,
      phone: formData.phone,
      alternate_phone: formData.alternatePhone || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zipCode || null,
      blood_group: formData.bloodGroup || null,
      allergies: formData.allergies,
      medical_conditions: formData.medicalConditions || null,
      current_medications: formData.currentMedications || null,
      pregnancy_status: formData.pregnancyStatus || null,
      emergency_contact_name: formData.emergencyContactName || null,
      emergency_contact_phone: formData.emergencyContactPhone || null,
      referring_doctor: formData.referringDoctor || null,
      first_visit_date: formData.firstVisitDate || null,
      chief_complaint: formData.chiefComplaint || null,
      previous_dentist: formData.previousDentist || null,
      last_dental_visit: formData.lastDentalVisit || null,
      treatment_notes: formData.treatmentNotes || null,
      insurance_provider: formData.insuranceProvider || null,
      policy_number: formData.policyNumber || null,
      coverage_percentage: formData.coveragePercentage ? parseFloat(formData.coveragePercentage) : null,
      billing_notes: formData.billingNotes || null,
      payment_method: formData.paymentMethod || null,
      sms_reminders: formData.smsReminders,
      email_reminders: formData.emailReminders,
      whatsapp_notifications: formData.whatsappNotifications,
      is_active: formData.activePatient,
    });

    if (error) {
      setSaveError(error.message);
      return;
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate(destination);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-green-600 px-6 py-3 text-white shadow-lg animate-in slide-in-from-top">
          ✓ Patient successfully added
        </div>
      )}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-destructive px-6 py-3 text-white shadow-lg">
          Error: {saveError}
        </div>
      )}

      <div className="p-8">
        <div className="mx-auto max-w-5xl">
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
                  onClick={() => saveAndNavigate("/patients")}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Save Patient
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <BasicInfoSection formData={formData} errors={errors} onChange={handleInputChange} />
            <MedicalInfoSection formData={formData} onChange={handleInputChange} />
            <DentalInfoSection formData={formData} onChange={handleInputChange} />
            <InsuranceBillingSection formData={formData} onChange={handleInputChange} />
            <CommunicationPreferencesSection formData={formData} onChange={handleInputChange} />
          </div>

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
                  onClick={() => saveAndNavigate("/calendar")}
                  className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  Save & Add Appointment
                </button>
                <button
                  onClick={() => saveAndNavigate("/patients")}
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
