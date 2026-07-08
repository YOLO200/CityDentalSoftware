import { useState } from "react";
import { Building2, Users, UserSquare2, Calendar, Receipt, Stethoscope, MessageCircle, Package, FlaskConical, Shield, ChevronDown, ChevronRight } from "lucide-react";

// ── Clinic Setup
import { ClinicProfile, Branches, ClinicTimings, Holidays, Departments, RoomsChairs } from "./settings/ClinicScreens";
// ── Users & Roles
import { Users as UsersScreen, Doctors, StaffMembers, RolesPermissions, AccessControl } from "./settings/UserScreens";
// ── Patient Settings
import { PatientGroups, MembershipPlans, ReferralSourcesSettings, ConsentForms, MedicalHistoryTemplates } from "./settings/PatientSettingsScreens";
// ── Appointment Settings
import { AppointmentCategories, AppointmentColors, AppointmentDuration, ReminderRules, FollowUpRules } from "./settings/AppointmentScreens";
// ── Billing & Finance
import { Taxes, PaymentModes, InvoiceTemplate, ReceiptSettings, DiscountRules, InsuranceSettings } from "./settings/BillingScreens";
// ── Treatments & Procedures
import { TreatmentCategories, TreatmentMaster, PrescriptionTemplates, ClinicalNotesTemplates } from "./settings/TreatmentScreens";
// ── Communication
import { SmsSettings, WhatsAppSettings, EmailSettings, NotificationTemplates } from "./settings/CommunicationSettingsScreens";
// ── Inventory Settings
import { InventoryCategories, Vendors, Units, StockThresholds } from "./settings/InventorySettingsScreens";
// ── Lab Settings
import { Labs, LabCategories, LabPricing } from "./settings/LabSettingsScreens";
// ── System Settings
import { BackupRestore, AuditLogs, Integrations, ApiKeys, SecuritySettings, SessionTimeout } from "./settings/SystemScreens";

// ─── Navigation config ────────────────────────────────────────────────────────

type NavItem    = { id: string; label: string };
type NavSection = { id: string; label: string; icon: React.ReactNode; items: NavItem[] };

const NAV: NavSection[] = [
  {
    id: "clinic", label: "Clinic Setup", icon: <Building2 className="h-4 w-4" />,
    items: [
      { id: "clinic-profile",  label: "Clinic Profile"    },
      { id: "branches",        label: "Branches / Centers"},
      { id: "timings",         label: "Clinic Timings"    },
      { id: "holidays",        label: "Holidays"          },
      { id: "departments",     label: "Departments"       },
      { id: "rooms",           label: "Rooms & Chairs"    },
    ],
  },
  {
    id: "users", label: "Users & Roles", icon: <Users className="h-4 w-4" />,
    items: [
      { id: "users",       label: "Users"              },
      { id: "doctors",     label: "Doctors"            },
      { id: "staff",       label: "Staff Members"      },
      { id: "roles",       label: "Roles & Permissions"},
      { id: "access",      label: "Access Control"     },
    ],
  },
  {
    id: "patients", label: "Patient Settings", icon: <UserSquare2 className="h-4 w-4" />,
    items: [
      { id: "patient-groups",  label: "Patient Groups"           },
      { id: "memberships",     label: "Membership Plans"         },
      { id: "referral-src",    label: "Referral Sources"         },
      { id: "consent-forms",   label: "Consent Forms"            },
      { id: "medical-hx",      label: "Medical History Templates"},
    ],
  },
  {
    id: "appointments", label: "Appointment Settings", icon: <Calendar className="h-4 w-4" />,
    items: [
      { id: "appt-categories", label: "Appointment Categories"},
      { id: "appt-colors",     label: "Appointment Colors"    },
      { id: "appt-duration",   label: "Appointment Duration"  },
      { id: "reminder-rules",  label: "Reminder Rules"        },
      { id: "followup-rules",  label: "Follow-up Rules"       },
    ],
  },
  {
    id: "billing", label: "Billing & Finance", icon: <Receipt className="h-4 w-4" />,
    items: [
      { id: "taxes",       label: "Taxes"             },
      { id: "pay-modes",   label: "Payment Modes"     },
      { id: "invoice-tpl", label: "Invoice Template"  },
      { id: "receipt-set", label: "Receipt Settings"  },
      { id: "discounts",   label: "Discount Rules"    },
      { id: "insurance",   label: "Insurance Settings"},
    ],
  },
  {
    id: "treatments", label: "Treatments & Procedures", icon: <Stethoscope className="h-4 w-4" />,
    items: [
      { id: "treat-cats",  label: "Treatment Categories"        },
      { id: "treat-master",label: "Treatment Master"            },
      { id: "rx-templates",label: "Prescription Templates"      },
      { id: "cn-templates",label: "Clinical Notes Templates"    },
    ],
  },
  {
    id: "communication", label: "Communication", icon: <MessageCircle className="h-4 w-4" />,
    items: [
      { id: "sms-settings", label: "SMS Settings"            },
      { id: "wa-settings",  label: "WhatsApp Settings"       },
      { id: "email-settings",label: "Email Settings"         },
      { id: "notif-tpl",    label: "Notification Templates"  },
    ],
  },
  {
    id: "inventory", label: "Inventory Settings", icon: <Package className="h-4 w-4" />,
    items: [
      { id: "inv-cats",    label: "Inventory Categories"},
      { id: "vendors",     label: "Vendors"             },
      { id: "units",       label: "Units"               },
      { id: "stock-thresh",label: "Stock Thresholds"    },
    ],
  },
  {
    id: "lab", label: "Lab Settings", icon: <FlaskConical className="h-4 w-4" />,
    items: [
      { id: "labs",      label: "Labs"          },
      { id: "lab-cats",  label: "Lab Categories"},
      { id: "lab-price", label: "Lab Pricing"   },
    ],
  },
  {
    id: "system", label: "System Settings", icon: <Shield className="h-4 w-4" />,
    items: [
      { id: "backup",    label: "Backup & Restore"  },
      { id: "audit",     label: "Audit Logs"        },
      { id: "integrations",label: "Integrations"   },
      { id: "api-keys",  label: "API Keys"          },
      { id: "security",  label: "Security Settings" },
      { id: "session",   label: "Session Timeout"   },
    ],
  },
];

// ─── Screen router ────────────────────────────────────────────────────────────

function renderScreen(id: string) {
  switch (id) {
    // Clinic Setup
    case "clinic-profile": return <ClinicProfile />;
    case "branches":       return <Branches />;
    case "timings":        return <ClinicTimings />;
    case "holidays":       return <Holidays />;
    case "departments":    return <Departments />;
    case "rooms":          return <RoomsChairs />;
    // Users & Roles
    case "users":          return <UsersScreen />;
    case "doctors":        return <Doctors />;
    case "staff":          return <StaffMembers />;
    case "roles":          return <RolesPermissions />;
    case "access":         return <AccessControl />;
    // Patient Settings
    case "patient-groups": return <PatientGroups />;
    case "memberships":    return <MembershipPlans />;
    case "referral-src":   return <ReferralSourcesSettings />;
    case "consent-forms":  return <ConsentForms />;
    case "medical-hx":     return <MedicalHistoryTemplates />;
    // Appointment Settings
    case "appt-categories":return <AppointmentCategories />;
    case "appt-colors":    return <AppointmentColors />;
    case "appt-duration":  return <AppointmentDuration />;
    case "reminder-rules": return <ReminderRules />;
    case "followup-rules": return <FollowUpRules />;
    // Billing & Finance
    case "taxes":          return <Taxes />;
    case "pay-modes":      return <PaymentModes />;
    case "invoice-tpl":    return <InvoiceTemplate />;
    case "receipt-set":    return <ReceiptSettings />;
    case "discounts":      return <DiscountRules />;
    case "insurance":      return <InsuranceSettings />;
    // Treatments
    case "treat-cats":     return <TreatmentCategories />;
    case "treat-master":   return <TreatmentMaster />;
    case "rx-templates":   return <PrescriptionTemplates />;
    case "cn-templates":   return <ClinicalNotesTemplates />;
    // Communication
    case "sms-settings":   return <SmsSettings />;
    case "wa-settings":    return <WhatsAppSettings />;
    case "email-settings": return <EmailSettings />;
    case "notif-tpl":      return <NotificationTemplates />;
    // Inventory
    case "inv-cats":       return <InventoryCategories />;
    case "vendors":        return <Vendors />;
    case "units":          return <Units />;
    case "stock-thresh":   return <StockThresholds />;
    // Lab
    case "labs":           return <Labs />;
    case "lab-cats":       return <LabCategories />;
    case "lab-price":      return <LabPricing />;
    // System
    case "backup":         return <BackupRestore />;
    case "audit":          return <AuditLogs />;
    case "integrations":   return <Integrations />;
    case "api-keys":       return <ApiKeys />;
    case "security":       return <SecuritySettings />;
    case "session":        return <SessionTimeout />;
    default:               return <ClinicProfile />;
  }
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function Settings() {
  const [active,   setActive]   = useState("clinic-profile");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ clinic: true });

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const navigate = (itemId: string, sectionId: string) => {
    setActive(itemId);
    setExpanded(prev => ({ ...prev, [sectionId]: true }));
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1e2d5a]">Settings</h2>
          <p className="text-[10px] text-gray-400">System Configuration</p>
        </div>

        <nav className="flex-1 py-2">
          {NAV.map(section => (
            <div key={section.id}>
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 group">
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-[#1e2d5a]">
                  {section.icon}
                  <span className="text-xs font-semibold">{section.label}</span>
                </div>
                {expanded[section.id]
                  ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
              </button>

              {expanded[section.id] && (
                <div className="pb-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id, section.id)}
                      className={`w-full text-left px-4 py-1.5 text-[11px] transition-colors ${
                        active === item.id
                          ? "bg-orange-50 text-orange-600 font-semibold border-r-2 border-orange-500"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      }`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5">
        {renderScreen(active)}
      </main>
    </div>
  );
}
