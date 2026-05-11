import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Team
import { DoctorUnavailability, AccessAudit } from "./admin/TeamScreens";
// NABH
import { AboutNabh, BiomedicalWaste, Fumigation, Sterilization, SporeTest, EquipmentMaster, EquipmentMaintenance, EquipmentBreakdown } from "./admin/NabhScreens";
// Accounting
import { CreditNotes, Settlements, PaymentReceive, PaymentGatewayTransactions, PaymentMade, CashBank, Journal, OpeningBalances } from "./admin/AccountingScreens";
// Inventory
import { InventoryPurchase, InventoryConsume, InventoryTransfer } from "./admin/InventoryScreens";
// Lab
import { LabBill, GiveReceiveLabWork } from "./admin/LabScreens";
// Other
import { SmsWaTransfer, RecurringTask } from "./admin/OtherScreens";

// ─── Sidebar config ───────────────────────────────────────────────────────────

type AdminPage =
  | "doctor-unavailability" | "access-audit"
  | "about-nabh" | "biomedical-waste" | "fumigation" | "sterilization"
  | "spore-test" | "equipment-master" | "equipment-maintenance" | "equipment-breakdown"
  | "credit-notes" | "settlements" | "payment-receive" | "payment-gateway"
  | "payment-made" | "cash-bank" | "journal" | "opening-balances"
  | "inv-purchase" | "inv-consume" | "inv-transfer"
  | "lab-bill" | "give-receive"
  | "recurring-task"
  | "smswa-transfer";

interface SidebarSection {
  title: string;
  items: { id: AdminPage; label: string }[];
}

const SIDEBAR: SidebarSection[] = [
  { title: "Team", items: [
    { id: "doctor-unavailability", label: "Doctor Unavailability" },
    { id: "access-audit",          label: "Access Audit" },
  ]},
  { title: "NABH", items: [
    { id: "about-nabh",             label: "About NABH" },
    { id: "biomedical-waste",        label: "Biomedical Waste" },
    { id: "fumigation",              label: "Fumigation" },
    { id: "sterilization",           label: "Sterilization" },
    { id: "spore-test",              label: "Spore Test" },
    { id: "equipment-master",        label: "Equipment Master" },
    { id: "equipment-maintenance",   label: "Equipment Maintenance" },
    { id: "equipment-breakdown",     label: "Equipment Breakdown" },
  ]},
  { title: "Accounting", items: [
    { id: "credit-notes",     label: "Credit Notes" },
    { id: "settlements",      label: "Settlements" },
    { id: "payment-receive",  label: "Payment Receive" },
    { id: "payment-gateway",  label: "Payment Gateway Transactions" },
    { id: "payment-made",     label: "Payment Made" },
    { id: "cash-bank",        label: "Cash/Bank" },
    { id: "journal",          label: "Journal" },
    { id: "opening-balances", label: "Opening Balances" },
  ]},
  { title: "Inventory", items: [
    { id: "inv-purchase", label: "Purchase" },
    { id: "inv-consume",  label: "Consume" },
    { id: "inv-transfer", label: "Transfer" },
  ]},
  { title: "Lab", items: [
    { id: "lab-bill",     label: "Lab Bill" },
    { id: "give-receive", label: "Give & Receive Lab Work" },
  ]},
  { title: "Tasks", items: [
    { id: "recurring-task", label: "Recurring Task" },
  ]},
  { title: "SMS/WA", items: [
    { id: "smswa-transfer", label: "SMS/WA Transfer" },
  ]},
];

// ─── Content router ───────────────────────────────────────────────────────────

function AdminContent({ page }: { page: AdminPage }) {
  switch (page) {
    case "doctor-unavailability":  return <DoctorUnavailability />;
    case "access-audit":           return <AccessAudit />;
    case "about-nabh":             return <AboutNabh />;
    case "biomedical-waste":       return <BiomedicalWaste />;
    case "fumigation":             return <Fumigation />;
    case "sterilization":          return <Sterilization />;
    case "spore-test":             return <SporeTest />;
    case "equipment-master":       return <EquipmentMaster />;
    case "equipment-maintenance":  return <EquipmentMaintenance />;
    case "equipment-breakdown":    return <EquipmentBreakdown />;
    case "credit-notes":           return <CreditNotes />;
    case "settlements":            return <Settlements />;
    case "payment-receive":        return <PaymentReceive />;
    case "payment-gateway":        return <PaymentGatewayTransactions />;
    case "payment-made":           return <PaymentMade />;
    case "cash-bank":              return <CashBank />;
    case "journal":                return <Journal />;
    case "opening-balances":       return <OpeningBalances />;
    case "inv-purchase":           return <InventoryPurchase />;
    case "inv-consume":            return <InventoryConsume />;
    case "inv-transfer":           return <InventoryTransfer />;
    case "lab-bill":               return <LabBill />;
    case "give-receive":           return <GiveReceiveLabWork />;
    case "recurring-task":         return <RecurringTask />;
    case "smswa-transfer":         return <SmsWaTransfer />;
    default:                       return null;
  }
}

// ─── Main Admin page ──────────────────────────────────────────────────────────

export function Admin() {
  const [activePage, setActivePage] = useState<AdminPage>("doctor-unavailability");
  const [collapsed,  setCollapsed]  = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setCollapsed(s => ({ ...s, [title]: !s[title] }));

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">

      {/* Secondary sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-3 pt-4 pb-4">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-1 mb-3">Admin</p>
          {SIDEBAR.map(section => {
            const isOpen = !collapsed[section.title];
            return (
              <div key={section.title} className="mb-1">
                <button onClick={() => toggle(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50">
                  <span className="text-[11px] font-bold text-[#1e2d5a] uppercase tracking-wide">
                    {section.title}
                  </span>
                  {isOpen
                    ? <ChevronDown  className="h-3 w-3 text-gray-400" />
                    : <ChevronRight className="h-3 w-3 text-gray-400" />
                  }
                </button>
                {isOpen && (
                  <div className="ml-1 mt-0.5">
                    {section.items.map(item => (
                      <button key={item.id} onClick={() => setActivePage(item.id)}
                        className={`w-full text-left px-3 py-1.5 rounded text-[11px] transition-colors leading-tight ${
                          activePage === item.id
                            ? "text-orange-500 font-semibold bg-orange-50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AdminContent key={activePage} page={activePage} />
      </div>
    </div>
  );
}
