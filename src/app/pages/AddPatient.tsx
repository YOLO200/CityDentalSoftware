import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Copy, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useBranch, branches } from "../context/BranchContext";

// ─── Floating-label primitives ───────────────────────────────────────────────

function FInput({
  label,
  required,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  return (
    <div
      className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors ${className}`}
    >
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      )}
      <input
        className={`w-full ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 text-sm outline-none bg-transparent`}
        {...props}
      />
    </div>
  );
}

function FSelect({
  label,
  required,
  options,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div
      className={`relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors ${className}`}
    >
      {label && (
        <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none z-10">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      )}
      <select
        className={`w-full appearance-none ${label ? "pt-5 pb-1.5" : "py-2.5"} px-3 pr-8 text-sm outline-none bg-transparent`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-[#3b3f8c]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Tab config ──────────────────────────────────────────────────────────────

type Tab = "basic" | "contact" | "insurance" | "more" | "medical" | "demographics";

const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "BASIC INFO" },
  { id: "contact", label: "CONTACT" },
  { id: "insurance", label: "INSURANCE" },
  { id: "more", label: "MORE" },
  { id: "medical", label: "MEDICAL" },
  { id: "demographics", label: "DEMOGRAPHICS" },
];

const MEDICAL_CONDITIONS = [
  "Diabetes", "Blood Pressure", "Thyroid", "Epilepsy", "Heart Disease", "Asthma",
  "Dental History", "Acidity", "Cholesterol", "Kidney Disease", "Pregnant/Breast Feeding",
  "Skin/Mucosa/Genitl lesion", "Anxiety/Depression", "Any Other", "Menstrual irregularities",
  "Respiratory diseases", "Bleeding disorders", "Blood transfusion", "Kidney/liver disease",
  "Trauma/Head injuries", "Covid 19 suspicious", "AIDS/HIV Positive", "Cancer",
  "Fainting/Blackouts", "Birth control pills",
];

const DENTAL_CONDITIONS = [
  "Bad Breath", "Bleeding gums", "Sensitivity", "Discoloured teeth", "Stained teeth",
  "Fractured teeth", "Missing teeth", "Cracked teeth",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { selectedBranch } = useBranch();

  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Basic Info — syncs from header selection; changes here don't affect the header
  const [center, setCenter] = useState(selectedBranch);
  useEffect(() => { setCenter(selectedBranch); }, [selectedBranch]);
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [middleNames, setMiddleNames] = useState("");
  const [suffix, setSuffix] = useState("");
  const [gender, setGender] = useState("");
  const [dobMode, setDobMode] = useState<"dob" | "age">("dob");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otherMobile, setOtherMobile] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [idType, setIdType] = useState("");
  const [patientSinceNew, setPatientSinceNew] = useState(true);
  const [patientSinceDate, setPatientSinceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [group, setGroup] = useState("");
  const [ratecard, setRatecard] = useState("Standard");
  const [searchTag, setSearchTag] = useState("");

  // Contact tab
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [addrState, setAddrState] = useState("");
  const [country, setCountry] = useState("India");
  const [areaCode, setAreaCode] = useState("");
  const [landline, setLandline] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [spouseNumber, setSpouseNumber] = useState("");
  const [generalPractitioner, setGeneralPractitioner] = useState("");

  // Insurance tab
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insuranceSubCompany, setInsuranceSubCompany] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceIdNumber, setInsuranceIdNumber] = useState("");

  // More tab
  const [familyStatus, setFamilyStatus] = useState("no");
  const [stdReminder, setStdReminder] = useState(true);
  const [smsDnd, setSmsDnd] = useState(false);
  const [emailDnd, setEmailDnd] = useState(false);
  const [trackerExcluded, setTrackerExcluded] = useState(false);
  const [excludeNote, setExcludeNote] = useState("");
  const [showTreatments, setShowTreatments] = useState(true);
  const [allowEditProfile, setAllowEditProfile] = useState(true);
  const [showTreatmentCharges, setShowTreatmentCharges] = useState(true);
  const [allowEditMedical, setAllowEditMedical] = useState(true);
  const [showFiles, setShowFiles] = useState(true);

  // Medical tab
  const [selectedMedical, setSelectedMedical] = useState<string[]>([]);
  const [selectedDental, setSelectedDental] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState("");
  const [allergicTo, setAllergicTo] = useState("");
  const [allergicToDrugs, setAllergicToDrugs] = useState("");

  // Demographics tab
  const [language, setLanguage] = useState("English");
  const [religion, setReligion] = useState("Unknown");
  const [occupation, setOccupation] = useState("Unknown");
  const [ethnicGroup, setEthnicGroup] = useState("");
  const [race, setRace] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [discProfile, setDiscProfile] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────

  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  const calcAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a.toString();
  };

  const toggleMedical = (c: string) =>
    setSelectedMedical((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleDental = (c: string) =>
    setSelectedDental((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSave = async () => {
    setSaveError(null);
    const { error } = await supabase.from("patients").insert({
      created_by: user?.id ?? null,
      first_name: firstName,
      last_name: surname,
      gender: gender || null,
      date_of_birth: dateOfBirth || null,
      phone: whatsappNumber,
      alternate_phone: otherMobile || null,
      email: personalEmail || null,
      address: address1 || null,
      city: city || null,
      state: addrState || null,
      zip_code: pinCode || null,
      blood_group: bloodGroup || null,
      allergies: allergicTo ? [allergicTo] : [],
      medical_conditions: selectedMedical.join(", ") || null,
      current_medications: currentMedications || null,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyNumber || null,
      first_visit_date: patientSinceDate || null,
      insurance_provider: insuranceCompany || null,
      policy_number: insuranceIdNumber || null,
      sms_reminders: !smsDnd,
      email_reminders: !emailDnd,
      whatsapp_notifications: stdReminder,
      is_active: true,
    });
    if (error) {
      setSaveError(error.message);
      return;
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/patients");
    }, 2000);
  };

  const now = new Date();
  const dateStr =
    now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  // ── Render helpers ─────────────────────────────────────────────────────────

  const SectionRow = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex gap-6">
      <div className="w-36 flex-shrink-0 pt-0.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );

  // ── Tab content ────────────────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <div className="space-y-5">
      {/* Profile photo + Center/PatientID */}
      <div className="flex gap-6 items-start">
        <div className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
          </svg>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#3b3f8c] rounded-full flex items-center justify-center shadow">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <FSelect
            label="Center"
            required
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            options={branches.map((b) => ({ value: b, label: b }))}
          />
          <FInput
            label="Patient ID"
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
        </div>
      </div>

      {/* Title + Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex gap-2">
          <FSelect
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            options={[
              { value: "", label: "" },
              { value: "Mr", label: "Mr" },
              { value: "Mrs", label: "Mrs" },
              { value: "Ms", label: "Ms" },
              { value: "Dr", label: "Dr" },
            ]}
            className="w-24 flex-shrink-0"
          />
          <FInput
            label="First/Full Name"
            required
            className="flex-1"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <FInput label="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
      </div>

      {/* Middle Names + Suffix */}
      <div className="grid grid-cols-2 gap-3">
        <FInput
          label="Middle Names"
          value={middleNames}
          onChange={(e) => setMiddleNames(e.target.value)}
        />
        <FInput label="Suffix" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
      </div>

      {/* Gender + DOB */}
      <div className="grid grid-cols-2 gap-3">
        {/* Gender */}
        <div className="border border-gray-300 rounded-lg p-3">
          <span className="text-[10px] text-gray-500 block mb-2">
            Gender<span className="text-red-500">*</span>
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {["Male", "Female", "Transgender", "Unknown"].map((g) => (
              <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g.toLowerCase()}
                  checked={gender === g.toLowerCase()}
                  onChange={() => setGender(g.toLowerCase())}
                  className="accent-[#3b3f8c]"
                />
                <span className="text-sm text-gray-700">{g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* DOB / Age */}
        <div className="border border-gray-300 rounded-lg p-3">
          <span className="text-[10px] text-gray-500 block mb-2">
            Date Of Birth (DOB)<span className="text-red-500">*</span>
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={dobMode === "dob"}
                onChange={() => setDobMode("dob")}
                className="accent-[#3b3f8c]"
              />
              <span className="text-sm text-gray-700">DOB</span>
              {dobMode === "dob" && (
                <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1 flex-1">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      setAge(calcAge(e.target.value));
                    }}
                    className="text-sm outline-none flex-1 bg-transparent"
                  />
                  {dateOfBirth && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateOfBirth("");
                        setAge("");
                      }}
                    >
                      <X className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={dobMode === "age"}
                onChange={() => setDobMode("age")}
                className="accent-[#3b3f8c]"
              />
              <span className="text-sm text-gray-700">Age</span>
              {dobMode === "age" && (
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-20 outline-none"
                />
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Marital Status */}
      <div className="w-1/2 pr-1.5">
        <FSelect
          label="Marital Status"
          value={maritalStatus}
          onChange={(e) => setMaritalStatus(e.target.value)}
          options={[
            { value: "", label: "Select Marital Status" },
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
            { value: "divorced", label: "Divorced" },
            { value: "widowed", label: "Widowed" },
          ]}
        />
      </div>

      {/* Contact subsection */}
      <SectionRow label="Contact">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex gap-2">
              <FSelect
                value="+91"
                onChange={() => {}}
                options={[{ value: "+91", label: "+91" }]}
                className="w-20 flex-shrink-0"
              />
              <FInput
                label="WhatsApp Number"
                className="flex-1"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <FSelect
                value="+91"
                onChange={() => {}}
                options={[{ value: "+91", label: "+91" }]}
                className="w-20 flex-shrink-0"
              />
              <FInput
                label="Other Mobile"
                className="flex-1"
                value={otherMobile}
                onChange={(e) => setOtherMobile(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FInput
              label="Personal Email"
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
            <FInput
              label="Work/Other Email"
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
            />
          </div>
        </div>
      </SectionRow>

      {/* Identification subsection */}
      <SectionRow label="Identification">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FSelect
              label="Nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              options={[
                { value: "", label: "Select Nationality" },
                { value: "indian", label: "Indian" },
                { value: "other", label: "Other" },
              ]}
            />
            <FInput
              label="National ID (Aadhar Card Number)"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
            />
          </div>
          <FSelect
            label="Select ID Type"
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            options={[
              { value: "", label: "Select ID Type" },
              { value: "aadhar", label: "Aadhar" },
              { value: "passport", label: "Passport" },
              { value: "pan", label: "PAN Card" },
              { value: "voter", label: "Voter ID" },
            ]}
            className="w-1/2"
          />
        </div>
      </SectionRow>

      {/* Relationship subsection */}
      <SectionRow label="Relationship">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Patient Since */}
            <div className="border border-gray-300 rounded-lg p-3">
              <span className="text-[10px] text-gray-500 block mb-1.5">Patient Since</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={patientSinceNew}
                  onChange={(e) => setPatientSinceNew(e.target.checked)}
                  className="accent-[#3b3f8c]"
                />
                <span className="text-sm text-gray-700">New</span>
                <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-0.5 flex-1">
                  <input
                    type="date"
                    value={patientSinceDate}
                    onChange={(e) => setPatientSinceDate(e.target.value)}
                    className="text-sm outline-none flex-1 bg-transparent"
                  />
                  <button type="button" onClick={() => setPatientSinceDate("")}>
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <FSelect
              label="Group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              options={[
                { value: "", label: "Select Group" },
                { value: "vip", label: "VIP" },
                { value: "regular", label: "Regular" },
              ]}
            />
          </div>
          <div className="w-1/2 pr-1.5">
            <FSelect
              label="Ratecard"
              required
              value={ratecard}
              onChange={(e) => setRatecard(e.target.value)}
              options={[
                { value: "Standard", label: "Standard" },
                { value: "Premium", label: "Premium" },
              ]}
            />
          </div>
          <FInput
            label="Search Tag"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
          />
        </div>
      </SectionRow>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6">
      <button className="flex items-center gap-2 border border-[#3b3f8c] text-[#3b3f8c] rounded px-3 py-1.5 text-sm hover:bg-indigo-50 transition-colors">
        <Copy className="h-3.5 w-3.5" />
        Paste from center
      </button>

      <SectionRow label="Address">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FInput
              label="Address line 1"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />
            <FInput
              label="Address line 2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors">
              <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none">
                Locality
              </span>
              <input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full pt-5 pb-1.5 pl-3 pr-8 text-sm outline-none bg-transparent"
              />
              <Copy className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 cursor-pointer" />
            </div>
            <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-indigo-400 transition-colors">
              <span className="absolute left-3 top-1.5 text-[10px] leading-none text-gray-500 pointer-events-none">
                City
              </span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pt-5 pb-1.5 pl-3 pr-8 text-sm outline-none bg-transparent"
              />
              <Copy className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 cursor-pointer" />
            </div>
            <FInput
              label="Pin code"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FSelect
              label="State"
              value={addrState}
              onChange={(e) => setAddrState(e.target.value)}
              options={[
                { value: "", label: "Select State" },
                { value: "gujarat", label: "Gujarat" },
                { value: "maharashtra", label: "Maharashtra" },
                { value: "rajasthan", label: "Rajasthan" },
                { value: "delhi", label: "Delhi" },
                { value: "karnataka", label: "Karnataka" },
              ]}
            />
            <FSelect
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: "India", label: "India" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <FInput
              label="Area Code"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
            />
            <div className="col-span-3">
              <FInput
                label="Landline number"
                value={landline}
                onChange={(e) => setLandline(e.target.value)}
              />
            </div>
          </div>
        </div>
      </SectionRow>

      <SectionRow label="Other Contacts">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FInput
              label="Emergency contact name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <FInput
              label="Emergency contact number"
              value={emergencyNumber}
              onChange={(e) => setEmergencyNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FInput
              label="Spouse Name"
              value={spouseName}
              onChange={(e) => setSpouseName(e.target.value)}
            />
            <FInput
              label="Spouse Contact Number"
              value={spouseNumber}
              onChange={(e) => setSpouseNumber(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <FSelect
              label="General Practitioner"
              value={generalPractitioner}
              onChange={(e) => setGeneralPractitioner(e.target.value)}
              options={[{ value: "", label: "Select General Practitioner" }]}
              className="flex-1"
            />
            <button className="border border-[#3b3f8c] text-[#3b3f8c] rounded-lg w-10 flex items-center justify-center hover:bg-indigo-50 transition-colors flex-shrink-0">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionRow>
    </div>
  );

  const renderInsurance = () => (
    <div className="space-y-6">
      <SectionRow label="Primary Insurance">
        <div className="space-y-3">
          <FSelect
            label="Company"
            value={insuranceCompany}
            onChange={(e) => setInsuranceCompany(e.target.value)}
            options={[{ value: "", label: "Select Company" }]}
          />
          <FSelect
            label="Sub Company"
            value={insuranceSubCompany}
            onChange={(e) => setInsuranceSubCompany(e.target.value)}
            options={[{ value: "", label: "Select Sub Company" }]}
          />
          <FSelect
            label="Policy"
            value={insurancePolicy}
            onChange={(e) => setInsurancePolicy(e.target.value)}
            options={[{ value: "", label: "Select Policy" }]}
          />
          <FInput
            label="Insurance Id Number"
            value={insuranceIdNumber}
            onChange={(e) => setInsuranceIdNumber(e.target.value)}
          />
          <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#3b3f8c] hover:bg-gray-50 transition-colors">
            <Plus className="h-4 w-4" />
            Add Another Insurance
          </button>
        </div>
      </SectionRow>
    </div>
  );

  const renderMore = () => (
    <div className="space-y-8">
      <SectionRow label="Family">
        <div className="border border-gray-300 rounded-lg p-4">
          <span className="text-xs text-gray-500 block mb-3">
            Activate family functionality for
            <span className="text-red-500 ml-0.5">*</span>
          </span>
          <div className="flex flex-wrap gap-6">
            {[
              { value: "no", label: "No" },
              { value: "head", label: "Yes, as a family head" },
              { value: "member", label: "Yes, as a family member" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="familyStatus"
                  value={opt.value}
                  checked={familyStatus === opt.value}
                  onChange={() => setFamilyStatus(opt.value)}
                  className="accent-[#3b3f8c]"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionRow>

      <SectionRow label="Notification preference">
        <div className="space-y-2.5">
          {[
            {
              label: "Standard Appointment Reminder",
              checked: stdReminder,
              onChange: () => setStdReminder((v) => !v),
            },
            { label: "SMS DND", checked: smsDnd, onChange: () => setSmsDnd((v) => !v) },
            { label: "Email DND", checked: emailDnd, onChange: () => setEmailDnd((v) => !v) },
          ].map((item) => (
            <label key={item.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.onChange}
                className="accent-[#3b3f8c] w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </SectionRow>

      <SectionRow label="Patient Tracker">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={trackerExcluded}
              onChange={() => setTrackerExcluded((v) => !v)}
              className="accent-[#3b3f8c] w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Excluded</span>
          </label>
          <div className="border border-gray-300 rounded-lg px-3 py-2.5">
            <input
              placeholder="Exclude Note"
              value={excludeNote}
              onChange={(e) => setExcludeNote(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
        </div>
      </SectionRow>

      <SectionRow label="Patient Portal Access">
        <div className="space-y-3">
          {[
            {
              label: "Show Treatments",
              checked: showTreatments,
              onChange: () => setShowTreatments((v) => !v),
            },
            {
              label: "Allow to Edit Profile",
              checked: allowEditProfile,
              onChange: () => setAllowEditProfile((v) => !v),
            },
            {
              label: "Show Treatments Charges",
              checked: showTreatmentCharges,
              onChange: () => setShowTreatmentCharges((v) => !v),
            },
            {
              label: "Allow to Edit Medical Conditions",
              checked: allowEditMedical,
              onChange: () => setAllowEditMedical((v) => !v),
            },
            { label: "Show Files", checked: showFiles, onChange: () => setShowFiles((v) => !v) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-60">{item.label}</span>
              <SwitchToggle checked={item.checked} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </SectionRow>
    </div>
  );

  const renderMedical = () => (
    <div className="space-y-6">
      <SectionRow label="Medical Conditions">
        <div>
          <div className="border border-gray-300 rounded-lg px-3 py-2 mb-3">
            <input className="w-full text-sm outline-none bg-transparent" />
          </div>
          <div className="flex flex-wrap gap-2">
            {MEDICAL_CONDITIONS.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => toggleMedical(cond)}
                className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                  selectedMedical.includes(cond)
                    ? "bg-[#3b3f8c] text-white border-[#3b3f8c]"
                    : "border-gray-300 text-gray-600 hover:border-[#3b3f8c] hover:text-[#3b3f8c]"
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
      </SectionRow>

      <SectionRow label="Dental Conditions">
        <div>
          <div className="border border-gray-300 rounded-lg px-3 py-2 mb-3">
            <input className="w-full text-sm outline-none bg-transparent" />
          </div>
          <div className="flex flex-wrap gap-2">
            {DENTAL_CONDITIONS.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => toggleDental(cond)}
                className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                  selectedDental.includes(cond)
                    ? "bg-[#3b3f8c] text-white border-[#3b3f8c]"
                    : "border-gray-300 text-gray-600 hover:border-[#3b3f8c] hover:text-[#3b3f8c]"
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
      </SectionRow>

      <SectionRow label="Current Medications">
        <div className="border border-gray-300 rounded-lg px-3 py-2.5">
          <input
            placeholder="Current Medications"
            value={currentMedications}
            onChange={(e) => setCurrentMedications(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
          />
        </div>
      </SectionRow>

      <SectionRow label="Allergies">
        <div className="space-y-3">
          <div className="border border-gray-300 rounded-lg px-3 py-2.5">
            <input
              placeholder="Allergic to"
              value={allergicTo}
              onChange={(e) => setAllergicTo(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
          <div className="border border-gray-300 rounded-lg px-3 py-2.5">
            <input
              placeholder="Select Allergic to Drugs"
              value={allergicToDrugs}
              onChange={(e) => setAllergicToDrugs(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
        </div>
      </SectionRow>

      <div className="flex gap-6">
        <div className="w-36 flex-shrink-0" />
        <div className="flex-1 border-b border-gray-200">
          <button className="flex items-center justify-between w-full text-[#3b3f8c] text-sm font-medium py-2">
            <span>Habits</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDemographics = () => (
    <div className="space-y-8">
      <SectionRow label="Demographics">
        <div className="space-y-3">
          <FSelect
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: "English", label: "English" },
              { value: "Hindi", label: "Hindi" },
              { value: "Gujarati", label: "Gujarati" },
              { value: "Marathi", label: "Marathi" },
            ]}
          />
          <FSelect
            label="Religion"
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            options={[
              { value: "Unknown", label: "Unknown" },
              { value: "Hindu", label: "Hindu" },
              { value: "Muslim", label: "Muslim" },
              { value: "Christian", label: "Christian" },
              { value: "Sikh", label: "Sikh" },
              { value: "Buddhist", label: "Buddhist" },
              { value: "Jain", label: "Jain" },
              { value: "Other", label: "Other" },
            ]}
          />
          <FSelect
            label="Occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            options={[
              { value: "Unknown", label: "Unknown" },
              { value: "Student", label: "Student" },
              { value: "Employed", label: "Employed" },
              { value: "Self-employed", label: "Self-employed" },
              { value: "Retired", label: "Retired" },
              { value: "Homemaker", label: "Homemaker" },
            ]}
          />
          <FSelect
            label="Ethnic Group"
            value={ethnicGroup}
            onChange={(e) => setEthnicGroup(e.target.value)}
            options={[
              { value: "", label: "Select Ethnic Group" },
              { value: "asian", label: "Asian" },
              { value: "caucasian", label: "Caucasian" },
              { value: "african", label: "African" },
              { value: "hispanic", label: "Hispanic" },
              { value: "other", label: "Other" },
            ]}
          />
          <FSelect
            label="Race"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            options={[
              { value: "", label: "Select Race" },
              { value: "asian", label: "Asian" },
              { value: "white", label: "White" },
              { value: "black", label: "Black" },
              { value: "mixed", label: "Mixed" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      </SectionRow>

      <SectionRow label="Other">
        <div className="grid grid-cols-2 gap-3">
          <FSelect
            label="Blood Group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            options={[
              { value: "", label: "Select Blood Group" },
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
          <FSelect
            label="DISC Profile"
            value={discProfile}
            onChange={(e) => setDiscProfile(e.target.value)}
            options={[
              { value: "", label: "Select DISC Profile" },
              { value: "D", label: "D - Dominance" },
              { value: "I", label: "I - Influence" },
              { value: "S", label: "S - Steadiness" },
              { value: "C", label: "C - Conscientiousness" },
            ]}
          />
        </div>
      </SectionRow>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg">
          ✓ Patient successfully added
        </div>
      )}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-red-600 px-6 py-3 text-white shadow-lg">
          Error: {saveError}
        </div>
      )}

      {/* Top row: back arrow + date */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <button
          onClick={() => navigate("/patients")}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-500">{dateStr}</span>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium tracking-wide transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area with side navigation arrows */}
      <div className="flex flex-1 relative">
        {/* Left arrow */}
        <button
          onClick={() => tabIndex > 0 && setActiveTab(TABS[tabIndex - 1].id)}
          disabled={tabIndex === 0}
          className="absolute left-1 top-1/3 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-opacity z-10"
          aria-label="Previous tab"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Tab content */}
        <div className="flex-1 px-14 py-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {activeTab === "basic" && renderBasicInfo()}
            {activeTab === "contact" && renderContact()}
            {activeTab === "insurance" && renderInsurance()}
            {activeTab === "more" && renderMore()}
            {activeTab === "medical" && renderMedical()}
            {activeTab === "demographics" && renderDemographics()}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() =>
            tabIndex < TABS.length - 1 && setActiveTab(TABS[tabIndex + 1].id)
          }
          disabled={tabIndex === TABS.length - 1}
          className="absolute right-1 top-1/3 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-opacity z-10"
          aria-label="Next tab"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <button className="text-orange-500 text-sm hover:underline">Need Help?</button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/patients")}
            className="px-6 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#1e2d5a] rounded text-sm text-white hover:bg-[#1a2650] transition-colors"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
