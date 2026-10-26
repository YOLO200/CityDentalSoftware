import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { PatientTracker } from "./crm/PatientTracker";
import { CampaignWidget, Enquiries, Prospects } from "./crm/EnquiryScreens";
import { OpportunityList, OpportunityPipeline } from "./crm/OpportunityScreens";
import { Emails, SmsWaUsageDetailed, SmsWaUsageSummary, WabaUsageDetailed } from "./crm/CommunicationUsage";

// ─── Navigation config ────────────────────────────────────────────────────────

type NavItem = { id: string; label: string };
type NavSection = { id: string; label: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    id: "growth", label: "Practice Growth",
    items: [{ id: "patient-tracker", label: "Patient Tracker" }],
  },
  {
    id: "crm", label: "CRM",
    items: [
      { id: "prospect", label: "Prospect" },
      { id: "enquiries", label: "Enquiries" },
      { id: "campaign-widget", label: "Campaign Widget" },
      { id: "opportunity", label: "Opportunity" },
    ],
  },
  {
    id: "communications", label: "Communications",
    items: [
      { id: "emails", label: "Emails" },
      { id: "sms-wa-detailed", label: "SMS/WA Usage Detailed" },
      { id: "waba-detailed", label: "WABA Usage Detailed" },
      { id: "sms-wa-summary", label: "SMS/WA Usage Summary" },
    ],
  },
];

const ACTIVE_KEY = "dentosys.crm.active";

/** Pipeline (kanban) by default, with the flat list one click away. */
function Opportunity() {
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["pipeline", "list"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full border px-3 py-1 text-xs ${view === v ? "border-[#1e2d5a] bg-[#1e2d5a] text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            {v === "pipeline" ? "Pipeline" : "List"}
          </button>
        ))}
      </div>
      {view === "pipeline" ? <OpportunityPipeline /> : <OpportunityList />}
    </div>
  );
}

function renderScreen(id: string) {
  switch (id) {
    case "patient-tracker": return <PatientTracker />;
    case "prospect":        return <Prospects />;
    case "enquiries":       return <Enquiries />;
    case "campaign-widget": return <CampaignWidget />;
    case "opportunity":     return <Opportunity />;
    case "emails":          return <Emails />;
    case "sms-wa-detailed": return <SmsWaUsageDetailed />;
    case "waba-detailed":   return <WabaUsageDetailed />;
    case "sms-wa-summary":  return <SmsWaUsageSummary />;
    default:                return <PatientTracker />;
  }
}

function readActive(): string {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    if (v && NAV.some((s) => s.items.some((i) => i.id === v))) return v;
  } catch { /* storage unavailable */ }
  return "patient-tracker";
}

// ─── CRM Page ─────────────────────────────────────────────────────────────────

export default function CRM() {
  const [active, setActive] = useState(readActive);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ growth: true, crm: true, communications: true });

  const open = (id: string) => {
    setActive(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* storage unavailable */ }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <aside className="w-64 flex-shrink-0 overflow-y-auto bg-gray-50">
        <nav>
          {NAV.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [section.id]: !p[section.id] }))}
                aria-expanded={expanded[section.id]}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-sm font-semibold text-[#1e2d5a]">{section.label}</span>
                {expanded[section.id]
                  ? <ChevronUp className="h-4 w-4 text-[#1e2d5a]" />
                  : <ChevronDown className="h-4 w-4 text-[#1e2d5a]" />}
              </button>
              {expanded[section.id] && (
                <div className="pb-2">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => open(item.id)}
                      aria-current={active === item.id ? "page" : undefined}
                      className={`block w-full px-6 py-2 text-left text-sm transition-colors ${
                        active === item.id ? "text-orange-500" : "text-gray-700 hover:text-[#1e2d5a]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-5">{renderScreen(active)}</main>
    </div>
  );
}
