export interface PatientFormData {
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

export type FormValue = string | boolean | string[];
export type FormErrors = Partial<Record<keyof PatientFormData, string>>;
export type OnChange = (field: keyof PatientFormData, value: FormValue) => void;

export const allergySuggestions = [
  "Penicillin",
  "Latex",
  "Lidocaine",
  "Epinephrine",
  "Aspirin",
  "Ibuprofen",
  "Codeine",
  "Sulfa drugs",
];
