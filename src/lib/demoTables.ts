/**
 * ────────────────────────────────────────────────────────────────────────────
 *  DEMO DATA SHIM — presentation scaffolding, not product code.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 29 tables that the Admin / Settings / CRM screens query were never created in
 * Postgres, so those screens error out and render empty. This module answers
 * for exactly those table names with in-memory rows, and forwards every other
 * table straight through to the real Supabase client.
 *
 * WHY IT LOOKS LIKE THIS
 * Screens consume queries as a chained builder that is awaited:
 *
 *     let q = supabase.from("lab_bills").select("*, branches(name)").order("x");
 *     if (bid) q = q.eq("branch_id", bid);
 *     const { data } = await q;
 *
 * so the shim has to be chainable and thenable, and has to honour filters and
 * ordering — otherwise Enable/Disable toggles and date filters would appear
 * broken on screen. Writes mutate the in-memory store, so adding a row during a
 * demo behaves the way a viewer expects.
 *
 * HOW TO TURN IT OFF
 * Set DEMO_TABLES_ENABLED = false below, or delete this file and revert the
 * `import { db as supabase }` lines in src/app/pages/{admin,settings,crm}. The
 * real screens are untouched; only their import line changed.
 *
 * WHEN A TABLE GETS BUILT FOR REAL
 * Delete its key from DEMO_ROWS. The shim stops intercepting that name and the
 * screen talks to Postgres with no further changes.
 */

import { supabase } from "./supabase";

export const DEMO_TABLES_ENABLED = true;

// ── date helpers so the data never looks stale ──────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
};
const iso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
const FY = (() => {
  // Indian financial year: April to March.
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
})();

/**
 * Rows that belong to a branch carry `__branch: 0 | 1 | 2` instead of a
 * hardcoded uuid. On first query the shim reads the real `branches` table and
 * rewrites those into a genuine `branch_id` plus the `branches: { name }` shape
 * the screens expect from their PostgREST embed. Without this, branch filters
 * and centre columns would show blanks against real branch ids.
 */
interface DemoRow {
  [k: string]: unknown;
  __branch?: number;
}

const ACTIVE = "Active";

const DEMO_ROWS: Record<string, DemoRow[]> = {
  // ══ Lab ═══════════════════════════════════════════════════════════════════
  labs: [
    { name: "Precision Dental Lab", contact_name: "Nilesh Bhatt",  phone: "+91 98240 11002", email: "work@precisiondental.in", address: "Gondal Road, Rajkot",   status: ACTIVE },
    { name: "Ceramic Arts Studio",  contact_name: "Hetal Shah",    phone: "+91 98240 11003", email: "orders@ceramicarts.in",   address: "Kalawad Road, Rajkot", status: ACTIVE },
    { name: "OrthoFab Appliances",  contact_name: "Rakesh Panara", phone: "+91 98240 11004", email: "info@orthofab.in",        address: "Yagnik Road, Rajkot",  status: ACTIVE },
    { name: "Shree Metal Works",    contact_name: "Dilip Joshi",   phone: "+91 98240 11005", email: null,                      address: "Bhavnagar Road, Rajkot", status: "Inactive" },
  ],
  lab_categories: [
    { name: "Crown & Bridge", status: ACTIVE },
    { name: "Dentures",       status: ACTIVE },
    { name: "Orthodontic Appliances", status: ACTIVE },
    { name: "Implant Components",     status: ACTIVE },
    { name: "Study Models",           status: ACTIVE },
  ],
  lab_work: [
    { __branch: 0, lab_name: "Precision Dental Lab", work_description: "PFM crown, tooth 36",        given_to: "Khush Jasani",  given_date: shift(-6), status: "Received",    notes: "Shade A2 confirmed" },
    { __branch: 0, lab_name: "Ceramic Arts Studio",  work_description: "Zirconia crown, tooth 16",   given_to: "Yashvi Jasani", given_date: shift(-3), status: "In Progress", notes: null },
    { __branch: 1, lab_name: "OrthoFab Appliances",  work_description: "Upper Hawley retainer",      given_to: "Rashmi",        given_date: shift(-2), status: "In Progress", notes: "Patient collecting Friday" },
    { __branch: 0, lab_name: "Precision Dental Lab", work_description: "Full upper denture, reline", given_to: "Khush Jasani",  given_date: shift(-9), status: "Received",    notes: null },
    { __branch: 2, lab_name: "Ceramic Arts Studio",  work_description: "3-unit bridge, 44–46",       given_to: "Yashvi Jasani", given_date: shift(-1), status: "Sent",        notes: "Urgent — patient travelling" },
  ],
  lab_bills: [
    { __branch: 0, lab_name: "Precision Dental Lab", bill_number: "PDL/2610", bill_date: shift(-12), entry_date: shift(-10), amount: 18400 },
    { __branch: 0, lab_name: "Ceramic Arts Studio",  bill_number: "CAS/0884", bill_date: shift(-8),  entry_date: shift(-7),  amount: 22750 },
    { __branch: 1, lab_name: "OrthoFab Appliances",  bill_number: "OFA/1190", bill_date: shift(-5),  entry_date: shift(-5),  amount: 9600  },
    { __branch: 2, lab_name: "Precision Dental Lab", bill_number: "PDL/2644", bill_date: shift(-2),  entry_date: shift(-1),  amount: 7300  },
  ],

  // ══ Inventory ═════════════════════════════════════════════════════════════
  vendors: [
    { name: "Dentmart Supplies",   contact_name: "Sanjay Kotak",  phone: "+91 98241 20011", email: "sales@dentmart.in",  address: "Race Course Road, Rajkot", gst_number: "24AABCD1234E1Z5", status: ACTIVE },
    { name: "MediEquip Gujarat",   contact_name: "Falguni Desai", phone: "+91 98241 20012", email: "info@mediequip.in",  address: "University Road, Rajkot",  gst_number: "24AAECM5678F1Z2", status: ACTIVE },
    { name: "Sterling Consumables",contact_name: "Ajay Vora",     phone: "+91 98241 20013", email: "orders@sterling.in", address: "Amin Marg, Rajkot",        gst_number: "24AAFCS9012G1Z8", status: ACTIVE },
    { name: "Krishna Pharma",      contact_name: "Manisha Pandya",phone: "+91 98241 20014", email: null,                 address: "Dhebar Road, Rajkot",      gst_number: null,              status: "Inactive" },
  ],
  inventory_categories: [
    { name: "Restorative",   status: ACTIVE },
    { name: "Anaesthetics",  status: ACTIVE },
    { name: "Consumables",   status: ACTIVE },
    { name: "Instruments",   status: ACTIVE },
    { name: "Sterilisation", status: ACTIVE },
    { name: "Orthodontic",   status: ACTIVE },
  ],
  inventory_transfers: [
    { __branch: 0, transfer_date: shift(-4), notes: "Monthly top-up to Virani Chowk",  from_branch_name: "Speedwell Premium Division", to_branch_name: "Virani Chowk" },
    { __branch: 0, transfer_date: shift(-1), notes: "Urgent — composite shortage",     from_branch_name: "Speedwell Premium Division", to_branch_name: "Kothariya"    },
  ],
  inventory_transfer_items: [
    { item_name: "Composite Resin Kit", quantity: 4, unit: "box"  },
    { item_name: "Lidocaine 2%",        quantity: 20, unit: "vial" },
  ],

  // ══ NABH / equipment ══════════════════════════════════════════════════════
  equipment: [
    { __branch: 0, name: "Autoclave — Class B",  equipment_code: "AUT-001", category: "Sterilisation", vendor: "MediEquip Gujarat", purchase_date: "2023-06-14", warranty_expiry: "2026-06-13", status: ACTIVE },
    { __branch: 0, name: "Dental Chair — Unit 1",equipment_code: "CHR-001", category: "Operatory",     vendor: "MediEquip Gujarat", purchase_date: "2022-11-02", warranty_expiry: "2025-11-01", status: ACTIVE },
    { __branch: 0, name: "Intraoral X-Ray",      equipment_code: "XRY-001", category: "Radiology",     vendor: "MediEquip Gujarat", purchase_date: "2024-01-20", warranty_expiry: "2027-01-19", status: ACTIVE },
    { __branch: 1, name: "Dental Chair — Unit 2",equipment_code: "CHR-002", category: "Operatory",     vendor: "Dentmart Supplies", purchase_date: "2023-03-08", warranty_expiry: "2026-03-07", status: ACTIVE },
    { __branch: 2, name: "Ultrasonic Scaler",    equipment_code: "SCL-001", category: "Instruments",   vendor: "Dentmart Supplies", purchase_date: "2024-08-11", warranty_expiry: "2026-08-10", status: ACTIVE },
  ],
  equipment_maintenance: [
    { equipment_name: "Autoclave — Class B",   maintenance_date: shift(-21), next_due_date: shift(9),  technician: "Bharat Service Co.", cost: 2400, status: "Completed", notes: "Gasket replaced" },
    { equipment_name: "Dental Chair — Unit 1", maintenance_date: shift(-14), next_due_date: shift(16), technician: "MediEquip Service",  cost: 1800, status: "Completed", notes: null },
    { equipment_name: "Intraoral X-Ray",       maintenance_date: shift(-7),  next_due_date: shift(83), technician: "MediEquip Service",  cost: 3200, status: "Completed", notes: "Calibration certificate filed" },
    { equipment_name: "Ultrasonic Scaler",     maintenance_date: shift(2),   next_due_date: shift(92), technician: "Bharat Service Co.", cost: null, status: "Scheduled", notes: null },
  ],
  equipment_breakdown: [
    { equipment_name: "Dental Chair — Unit 2", breakdown_date: shift(-11), issue_description: "Hydraulic lift intermittent",  assigned_technician: "MediEquip Service", resolution_notes: "Valve replaced, tested OK", status: "Resolved" },
    { equipment_name: "Autoclave — Class B",   breakdown_date: shift(-2),  issue_description: "Cycle aborting at drying phase", assigned_technician: "Bharat Service Co.", resolution_notes: null, status: "Open" },
  ],

  // ══ Accounting ════════════════════════════════════════════════════════════
  journal_entries: [
    { __branch: 0, date: shift(-5), debit_account: "Lab Charges",      credit_account: "Bank — HDFC", amount: 18400, narration: "Precision Dental Lab PDL/2610" },
    { __branch: 0, date: shift(-4), debit_account: "Consumables",      credit_account: "Cash",        amount: 6250,  narration: "Dentmart restock" },
    { __branch: 1, date: shift(-3), debit_account: "Bank — HDFC",      credit_account: "Treatment Income", amount: 42800, narration: "Daily collection deposit" },
    { __branch: 0, date: shift(-2), debit_account: "Salaries",         credit_account: "Bank — HDFC", amount: 185000, narration: "Staff payroll" },
    { __branch: 2, date: shift(-1), debit_account: "Electricity",      credit_account: "Bank — HDFC", amount: 9400,  narration: "PGVCL bill" },
  ],
  cash_bank_entries: [
    { __branch: 0, date: shift(-3), type: "Receipt", description: "Cash collection — front desk", amount: 24600, reference: "CSH-4412" },
    { __branch: 0, date: shift(-2), type: "Payment", description: "Lab bill settlement",         amount: 18400, reference: "CHQ-100244" },
    { __branch: 1, date: shift(-2), type: "Receipt", description: "UPI settlement batch",        amount: 31200, reference: "UPI-88190" },
    { __branch: 2, date: shift(-1), type: "Payment", description: "Consumables purchase",        amount: 5800,  reference: "CSH-4418" },
  ],
  credit_notes: [
    { __branch: 0, note_number: "CN-0041", date: shift(-9), amount: 3200, reason: "Treatment discontinued at patient request", status: "Issued" },
    { __branch: 1, note_number: "CN-0042", date: shift(-4), amount: 1500, reason: "Duplicate receipt raised",                  status: "Issued" },
    { __branch: 0, note_number: "CN-0043", date: shift(-1), amount: 900,  reason: "Billing correction — scaling charged twice", status: "Draft"  },
  ],
  opening_balances: [
    { __branch: 0, financial_year: FY, as_on_date: shift(-180), account_name: "Cash",              debit: 45000,  credit: 0 },
    { __branch: 0, financial_year: FY, as_on_date: shift(-180), account_name: "Bank — HDFC",       debit: 620000, credit: 0 },
    { __branch: 0, financial_year: FY, as_on_date: shift(-180), account_name: "Sundry Creditors",  debit: 0,      credit: 88000 },
    { __branch: 0, financial_year: FY, as_on_date: shift(-180), account_name: "Equipment",         debit: 1450000,credit: 0 },
  ],
  payment_gateway_transactions: [
    { __branch: 0, created_at: iso(-1), amount: 4500, status: "Success", gateway: "Razorpay", txn_id: "pay_Nx8821aQ", patient_name: "Rajesh Patel"  },
    { __branch: 0, created_at: iso(-1), amount: 2200, status: "Success", gateway: "Razorpay", txn_id: "pay_Nx8834bR", patient_name: "Priya Mehta"   },
    { __branch: 1, created_at: iso(-2), amount: 8900, status: "Success", gateway: "Razorpay", txn_id: "pay_Nx8790cS", patient_name: "Chirag Dholakia" },
    { __branch: 0, created_at: iso(-3), amount: 1500, status: "Failed",  gateway: "Razorpay", txn_id: "pay_Nx8744dT", patient_name: "Nisha Shah"    },
    { __branch: 2, created_at: iso(-4), amount: 6200, status: "Refunded",gateway: "Razorpay", txn_id: "pay_Nx8701eU", patient_name: "Sanjay Chauhan" },
  ],

  // ══ Billing settings ══════════════════════════════════════════════════════
  payment_modes: [
    { name: "Cash",        is_default: true,  status: ACTIVE },
    { name: "Card",        is_default: false, status: ACTIVE },
    { name: "UPI",         is_default: false, status: ACTIVE },
    { name: "Net Banking", is_default: false, status: ACTIVE },
    { name: "Cheque",      is_default: false, status: ACTIVE },
    { name: "Insurance",   is_default: false, status: ACTIVE },
  ],
  taxes: [
    { name: "GST 18%", percentage: 18, status: ACTIVE },
    { name: "GST 12%", percentage: 12, status: ACTIVE },
    { name: "GST 5%",  percentage: 5,  status: ACTIVE },
    { name: "Exempt",  percentage: 0,  status: ACTIVE },
  ],

  // ══ Treatments ════════════════════════════════════════════════════════════
  treatment_categories: [
    { name: "Preventive",    description: "Cleaning, fluoride, sealants",      status: ACTIVE },
    { name: "Restorative",   description: "Fillings, crowns, bridges",         status: ACTIVE },
    { name: "Endodontics",   description: "Root canal therapy",                status: ACTIVE },
    { name: "Periodontics",  description: "Gum and supporting structures",     status: ACTIVE },
    { name: "Oral Surgery",  description: "Extractions and implants",          status: ACTIVE },
    { name: "Orthodontics",  description: "Braces and aligners",               status: ACTIVE },
    { name: "Prosthodontics",description: "Dentures and full-mouth rehab",     status: ACTIVE },
  ],
  treatments: [
    { name: "Consultation",          category_name: "Preventive",    description: "Examination and treatment planning", duration_minutes: 30, base_price: 500,   tax_name: "Exempt",  status: ACTIVE },
    { name: "Scaling & Polishing",   category_name: "Preventive",    description: "Full-mouth scaling",                 duration_minutes: 45, base_price: 1500,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Composite Filling",     category_name: "Restorative",   description: "Tooth-coloured restoration",         duration_minutes: 45, base_price: 2200,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Root Canal — Molar",    category_name: "Endodontics",   description: "Multi-visit RCT",                    duration_minutes: 60, base_price: 7500,  tax_name: "GST 18%", status: ACTIVE },
    { name: "PFM Crown",             category_name: "Restorative",   description: "Porcelain fused to metal",           duration_minutes: 60, base_price: 8500,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Zirconia Crown",        category_name: "Restorative",   description: "Full-contour zirconia",              duration_minutes: 60, base_price: 14000, tax_name: "GST 18%", status: ACTIVE },
    { name: "Extraction — Simple",   category_name: "Oral Surgery",  description: "Non-surgical extraction",            duration_minutes: 30, base_price: 1200,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Extraction — Surgical", category_name: "Oral Surgery",  description: "Impacted or sectioned",              duration_minutes: 60, base_price: 4500,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Implant Placement",     category_name: "Oral Surgery",  description: "Single-stage implant",               duration_minutes: 90, base_price: 32000, tax_name: "GST 18%", status: ACTIVE },
    { name: "Gum Treatment",         category_name: "Periodontics",  description: "Root planing per quadrant",          duration_minutes: 45, base_price: 3000,  tax_name: "GST 18%", status: ACTIVE },
    { name: "Braces — Metal",        category_name: "Orthodontics",  description: "Full fixed appliance course",        duration_minutes: 60, base_price: 45000, tax_name: "GST 18%", status: ACTIVE },
    { name: "Complete Denture",      category_name: "Prosthodontics",description: "Upper and lower set",                duration_minutes: 90, base_price: 28000, tax_name: "GST 18%", status: ACTIVE },
    { name: "Teeth Whitening",       category_name: "Restorative",   description: "In-chair bleaching",                 duration_minutes: 60, base_price: 9000,  tax_name: "GST 18%", status: "Inactive" },
  ],

  // ══ Appointment settings ══════════════════════════════════════════════════
  appointment_categories: [
    { name: "Consultation",  color: "#3B82F6", duration_minutes: 30, status: ACTIVE },
    { name: "Treatment",     color: "#10B981", duration_minutes: 60, status: ACTIVE },
    { name: "Follow-up",     color: "#F59E0B", duration_minutes: 20, status: ACTIVE },
    { name: "Emergency",     color: "#EF4444", duration_minutes: 45, status: ACTIVE },
    { name: "Ortho Review",  color: "#8B5CF6", duration_minutes: 20, status: ACTIVE },
  ],

  // ══ Patient settings ══════════════════════════════════════════════════════
  patient_groups: [
    { name: "General",          description: "Standard walk-in and referred patients", discount_percentage: 0,  status: ACTIVE },
    { name: "Staff & Family",   description: "Employees and immediate family",          discount_percentage: 25, status: ACTIVE },
    { name: "Senior Citizen",   description: "Patients over 60",                        discount_percentage: 10, status: ACTIVE },
    { name: "Corporate — Tier 1", description: "Empanelled corporate accounts",         discount_percentage: 15, status: ACTIVE },
  ],
  membership_plans: [
    { name: "Smile Basic",   price: 3000,  duration_months: 12, discount_percentage: 10, benefits: "2 cleanings, 1 consultation, 10% on treatments", status: ACTIVE },
    { name: "Smile Plus",    price: 7500,  duration_months: 12, discount_percentage: 20, benefits: "4 cleanings, unlimited consultations, 20% on treatments, 1 free X-ray", status: ACTIVE },
    { name: "Family Care",   price: 18000, duration_months: 12, discount_percentage: 25, benefits: "Covers 4 members, 25% on all treatments", status: ACTIVE },
    { name: "Ortho Care",    price: 12000, duration_months: 24, discount_percentage: 15, benefits: "All ortho adjustments included, 15% on appliances", status: ACTIVE },
  ],

  // ══ Communication credits ═════════════════════════════════════════════════
  sms_wa_credits: [
    { __branch: 0, sms_balance: 8420, wa_balance: 3150, updated_at: iso(-1) },
    { __branch: 1, sms_balance: 4610, wa_balance: 1880, updated_at: iso(-1) },
    { __branch: 2, sms_balance: 2240, wa_balance: 960,  updated_at: iso(-2) },
  ],
  sms_wa_transfers: [
    { __branch: 0, sms_qty: 1000, wa_qty: 500, from_branch_name: "Speedwell Premium Division", to_branch_name: "Kothariya",    created_at: iso(-6) },
    { __branch: 0, sms_qty: 2000, wa_qty: 750, from_branch_name: "Speedwell Premium Division", to_branch_name: "Virani Chowk", created_at: iso(-2) },
  ],

  // ══ CRM ═══════════════════════════════════════════════════════════════════
  recurring_tasks: [
    { __branch: 0, name: "Autoclave spore test",        frequency: "Weekly",  start_date: shift(-60), next_due_date: shift(3),  status: ACTIVE, notes: "Log result in NABH register", assignee_name: "Nurse Rekha"   },
    { __branch: 0, name: "Stock count — consumables",   frequency: "Monthly", start_date: shift(-90), next_due_date: shift(8),  status: ACTIVE, notes: null,                            assignee_name: "Admin Pooja"   },
    { __branch: 1, name: "Biomedical waste handover",   frequency: "Weekly",  start_date: shift(-45), next_due_date: shift(1),  status: ACTIVE, notes: "Signed manifest required",      assignee_name: "Nurse Meera"   },
    { __branch: 0, name: "Recall list — 6-month checks",frequency: "Monthly", start_date: shift(-120),next_due_date: shift(12), status: ACTIVE, notes: "Pull from patient recall query",assignee_name: "Admin Pooja"   },
    { __branch: 2, name: "Chair maintenance check",     frequency: "Monthly", start_date: shift(-75), next_due_date: shift(5),  status: "Paused", notes: null,                          assignee_name: "Assistant Kiran" },
  ],
  lead_followups: [
    { followup_date: shift(-5), followup_type: "Call",     outcome: "Interested",   next_action: "Send implant quote",        notes: "Asked about EMI options",     status: "Completed", lead_name: "Walk-in — Pareshbhai" },
    { followup_date: shift(-3), followup_type: "WhatsApp", outcome: "No response",  next_action: "Retry in 3 days",           notes: null,                          status: "Pending",   lead_name: "Google Ads — Rita M."  },
    { followup_date: shift(-1), followup_type: "Call",     outcome: "Booked",       next_action: "Appointment scheduled",     notes: "Converted — ortho consult",   status: "Completed", lead_name: "Referral — Jayeshbhai" },
    { followup_date: shift(1),  followup_type: "Call",     outcome: null,           next_action: "Discuss whitening package", notes: null,                          status: "Scheduled", lead_name: "Instagram — Anita P."  },
  ],

  // ══ Clinic settings (key/value store) ═════════════════════════════════════
  clinic_settings: [
    { key: "clinic_name",     value: "City Dental Hospital" },
    { key: "tagline",         value: "Complete dental care, one roof" },
    { key: "reg_number",      value: "GJ/RJT/DEN/2019/4471" },
    { key: "gst_number",      value: "24AABCC1234D1Z9" },
    { key: "website",         value: "https://citydental.in" },
    { key: "email",           value: "care@citydental.in" },
    { key: "phone",           value: "+91 281 244 0001" },
    { key: "emergency_phone", value: "+91 98250 40000" },
    { key: "address_line1",   value: "Speedwell Complex, Kalawad Road" },
    { key: "address_line2",   value: "Opp. Nirmala Convent" },
    { key: "city",            value: "Rajkot" },
    { key: "state",           value: "Gujarat" },
    { key: "zip_code",        value: "360005" },
    { key: "country",         value: "India" },
    { key: "timezone",        value: "Asia/Kolkata" },
    { key: "currency",        value: "INR" },
    { key: "date_format",     value: "DD/MM/YYYY" },
    { key: "language",        value: "English" },
    { key: "primary_color",   value: "#1e2d5a" },
    { key: "secondary_color", value: "#f97316" },
    { key: "sec_min_password_length",    value: "8"    },
    { key: "sec_require_uppercase",      value: "true" },
    { key: "sec_require_numbers",        value: "true" },
    { key: "sec_require_special_chars",  value: "false" },
    { key: "sec_password_expiry_days",   value: "90"   },
    { key: "session_timeout_minutes",       value: "30"   },
    { key: "session_force_logout_inactive", value: "true" },
    { key: "session_remember_me_enabled",   value: "true" },
  ],
};

// ── branch resolution ───────────────────────────────────────────────────────
let branchCache: { id: string; name: string }[] | null = null;
let materialised = false;

async function realBranches() {
  if (branchCache) return branchCache;
  const { data } = await supabase.from("branches").select("id, name").order("name");
  branchCache = (data ?? []) as { id: string; name: string }[];
  return branchCache;
}

/** Rewrite every `__branch: n` marker into a real branch_id + embed shape. */
async function materialise() {
  if (materialised) return;
  const branches = await realBranches();
  for (const rows of Object.values(DEMO_ROWS)) {
    for (const r of rows) {
      if (r.id === undefined) r.id = crypto.randomUUID();
      if (r.__branch === undefined) continue;
      const b = branches[r.__branch % Math.max(branches.length, 1)];
      if (b) {
        r.branch_id = b.id;
        r.branches = { name: b.name };
      } else {
        // No branches in the DB at all — keep the screen populated anyway.
        r.branch_id = null;
        r.branches = { name: "—" };
      }
    }
  }
  materialised = true;
}

// ── a minimal PostgREST-shaped query builder over an array ──────────────────
type Pred = (r: DemoRow) => boolean;

class DemoQuery implements PromiseLike<{ data: unknown; error: null; count: number }> {
  private preds: Pred[] = [];
  private sortKey: string | null = null;
  private sortAsc = true;
  private take: number | null = null;
  private one = false;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: DemoRow[] = [];

  constructor(private table: string) {}

  // ── shaping (no-ops that keep the chain alive) ──
  select()   { return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.sortKey = col;
    this.sortAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) { this.take = n; return this; }
  range(_f: number, t: number) { this.take = t + 1; return this; }
  single()      { this.one = true; return this; }
  maybeSingle() { this.one = true; return this; }

  // ── filters ──
  eq(c: string, v: unknown)  { this.preds.push(r => String(r[c] ?? "") === String(v)); return this; }
  neq(c: string, v: unknown) { this.preds.push(r => String(r[c] ?? "") !== String(v)); return this; }
  gt(c: string, v: unknown)  { this.preds.push(r => String(r[c] ?? "") >  String(v)); return this; }
  gte(c: string, v: unknown) { this.preds.push(r => String(r[c] ?? "") >= String(v)); return this; }
  lt(c: string, v: unknown)  { this.preds.push(r => String(r[c] ?? "") <  String(v)); return this; }
  lte(c: string, v: unknown) { this.preds.push(r => String(r[c] ?? "") <= String(v)); return this; }
  in(c: string, vs: unknown[]) { this.preds.push(r => vs.map(String).includes(String(r[c] ?? ""))); return this; }
  is(c: string, v: unknown)  { this.preds.push(r => (v === null ? r[c] == null : r[c] === v)); return this; }
  ilike(c: string, pat: string) {
    const needle = String(pat).replace(/%/g, "").toLowerCase();
    this.preds.push(r => String(r[c] ?? "").toLowerCase().includes(needle));
    return this;
  }
  like(c: string, pat: string) { return this.ilike(c, pat); }
  /** `or()` is accepted but not evaluated — demo rows are small enough that a
   *  missed disjunction only ever shows more rows, never fewer than expected. */
  or() { return this; }
  filter() { return this; }
  not()    { return this; }
  match(o: Record<string, unknown>) {
    for (const [c, v] of Object.entries(o)) this.eq(c, v);
    return this;
  }

  // ── writes: mutate the store so the UI reacts ──
  insert(rows: DemoRow | DemoRow[]) {
    this.op = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  upsert(rows: DemoRow | DemoRow[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    (this as unknown as { conflict?: string }).conflict = opts?.onConflict;
    return this;
  }
  update(patch: DemoRow) { this.op = "update"; this.payload = [patch]; return this; }
  delete()               { this.op = "delete"; return this; }

  private store() {
    DEMO_ROWS[this.table] ??= [];
    return DEMO_ROWS[this.table];
  }

  private async run() {
    await materialise();
    const store = this.store();
    const match = (r: DemoRow) => this.preds.every(p => p(r));

    if (this.op === "insert" || this.op === "upsert") {
      const conflict = (this as unknown as { conflict?: string }).conflict;
      const keys = conflict ? conflict.split(",").map(s => s.trim()) : [];
      const written: DemoRow[] = [];
      for (const row of this.payload) {
        const fresh: DemoRow = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
        const hit = keys.length
          ? store.find(r => keys.every(k => String(r[k] ?? "") === String(fresh[k] ?? "")))
          : undefined;
        if (hit) Object.assign(hit, row);
        else store.unshift(fresh);
        written.push(hit ?? fresh);
      }
      return { data: this.one ? written[0] ?? null : written, error: null, count: written.length };
    }

    if (this.op === "update") {
      const hits = store.filter(match);
      for (const r of hits) Object.assign(r, this.payload[0]);
      return { data: this.one ? hits[0] ?? null : hits, error: null, count: hits.length };
    }

    if (this.op === "delete") {
      const hits = store.filter(match);
      for (const r of hits) store.splice(store.indexOf(r), 1);
      return { data: hits, error: null, count: hits.length };
    }

    let rows = store.filter(match);
    if (this.sortKey) {
      const k = this.sortKey;
      rows = [...rows].sort((a, b) => {
        const av = String(a[k] ?? ""), bv = String(b[k] ?? "");
        return this.sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (this.take != null) rows = rows.slice(0, this.take);
    return { data: this.one ? rows[0] ?? null : rows, error: null, count: rows.length };
  }

  then<R1 = { data: unknown; error: null; count: number }, R2 = never>(
    onOk?: ((v: { data: unknown; error: null; count: number }) => R1 | PromiseLike<R1>) | null,
    onErr?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onOk, onErr);
  }
  catch(onErr: (e: unknown) => unknown) { return this.run().catch(onErr); }
  finally(fn: () => void)               { return this.run().finally(fn); }
}

const warned = new Set<string>();

/**
 * Drop-in replacement for the Supabase client that answers for demo-only
 * tables and delegates everything else. Imported as
 * `import { db as supabase }` so call sites stay unchanged.
 */
export const db = {
  ...supabase,
  from(table: string) {
    if (DEMO_TABLES_ENABLED && table in DEMO_ROWS) {
      if (!warned.has(table)) {
        warned.add(table);
        console.info(
          `[demo-data] "${table}" does not exist in Postgres — serving in-memory rows ` +
          `(src/lib/demoTables.ts). Delete its key from DEMO_ROWS once the table is built.`,
        );
      }
      return new DemoQuery(table) as unknown as ReturnType<typeof supabase.from>;
    }
    return supabase.from(table);
  },
  auth: supabase.auth,
  rpc: supabase.rpc.bind(supabase),
  storage: supabase.storage,
  channel: supabase.channel.bind(supabase),
};

/** Table names currently served from memory — handy in the console. */
export const DEMO_TABLE_NAMES = Object.keys(DEMO_ROWS).sort();
