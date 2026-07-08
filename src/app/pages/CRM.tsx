import { useState } from "react";
import {
  Users, Target, MessageSquare, TrendingUp, CheckSquare,
  ChevronDown, ChevronRight,
} from "lucide-react";

// Leads
import {
  LeadDashboard, LeadList, AddLead, LeadFollowups,
  MissedFollowups, ConvertedLeads, LostLeads,
} from "./crm/LeadScreens";

// Opportunities
import {
  OpportunityDashboard, OpportunityPipeline, OpportunityList,
  ClosedWon, ClosedLost,
} from "./crm/OpportunityScreens";

// Communication
import {
  CommunicationCenter, Templates, BulkMessaging,
  SMSCampaigns, WhatsAppCampaigns, EmailCampaigns,
} from "./crm/CommunicationScreens";

// Marketing
import {
  ReferralSources, CampaignTracking, PatientRetention,
  FeedbackReviews, MembershipCampaigns,
} from "./crm/MarketingScreens";

// Tasks
import { TaskList, RecurringTasks, ReminderCenter } from "./crm/TaskScreens";

// ─── Navigation config ────────────────────────────────────────────────────────

type NavItem = { id: string; label: string };
type NavSection = { id: string; label: string; icon: React.ReactNode; items: NavItem[] };

const NAV: NavSection[] = [
  {
    id: "leads", label: "Leads", icon: <Users className="h-4 w-4" />,
    items: [
      { id: "lead-dashboard",   label: "Lead Dashboard" },
      { id: "lead-list",        label: "Lead List" },
      { id: "add-lead",         label: "Add Lead" },
      { id: "lead-followups",   label: "Lead Follow-ups" },
      { id: "missed-followups", label: "Missed Follow-ups" },
      { id: "converted-leads",  label: "Converted Leads" },
      { id: "lost-leads",       label: "Lost Leads" },
    ],
  },
  {
    id: "opportunities", label: "Opportunities", icon: <Target className="h-4 w-4" />,
    items: [
      { id: "opp-dashboard", label: "Dashboard" },
      { id: "opp-pipeline",  label: "Pipeline (Kanban)" },
      { id: "opp-list",      label: "Opportunity List" },
      { id: "closed-won",    label: "Closed Won" },
      { id: "closed-lost",   label: "Closed Lost" },
    ],
  },
  {
    id: "communication", label: "Communication", icon: <MessageSquare className="h-4 w-4" />,
    items: [
      { id: "comm-center",    label: "Communication Center" },
      { id: "templates",      label: "Templates" },
      { id: "bulk-messaging", label: "Bulk Messaging" },
      { id: "sms-campaigns",  label: "SMS Campaigns" },
      { id: "wa-campaigns",   label: "WhatsApp Campaigns" },
      { id: "email-campaigns",label: "Email Campaigns" },
    ],
  },
  {
    id: "marketing", label: "Marketing", icon: <TrendingUp className="h-4 w-4" />,
    items: [
      { id: "referral-sources",    label: "Referral Sources" },
      { id: "campaign-tracking",   label: "Campaign Tracking" },
      { id: "patient-retention",   label: "Patient Retention" },
      { id: "feedback-reviews",    label: "Feedback & Reviews" },
      { id: "membership-campaigns",label: "Membership Campaigns" },
    ],
  },
  {
    id: "tasks", label: "Tasks & Follow-ups", icon: <CheckSquare className="h-4 w-4" />,
    items: [
      { id: "task-list",      label: "Task List" },
      { id: "recurring-tasks",label: "Recurring Tasks" },
      { id: "reminder-center",label: "Reminder Center" },
    ],
  },
];

// ─── Screen router ────────────────────────────────────────────────────────────

function renderScreen(id: string, onNavigate: (page: string) => void) {
  switch (id) {
    // Leads
    case "lead-dashboard":   return <LeadDashboard onNavigate={onNavigate} />;
    case "lead-list":        return <LeadList onNavigate={onNavigate} />;
    case "add-lead":         return <AddLead onNavigate={onNavigate} />;
    case "lead-followups":   return <LeadFollowups />;
    case "missed-followups": return <MissedFollowups />;
    case "converted-leads":  return <ConvertedLeads />;
    case "lost-leads":       return <LostLeads />;
    // Opportunities
    case "opp-dashboard":    return <OpportunityDashboard />;
    case "opp-pipeline":     return <OpportunityPipeline />;
    case "opp-list":         return <OpportunityList />;
    case "closed-won":       return <ClosedWon />;
    case "closed-lost":      return <ClosedLost />;
    // Communication
    case "comm-center":      return <CommunicationCenter />;
    case "templates":        return <Templates />;
    case "bulk-messaging":   return <BulkMessaging />;
    case "sms-campaigns":    return <SMSCampaigns />;
    case "wa-campaigns":     return <WhatsAppCampaigns />;
    case "email-campaigns":  return <EmailCampaigns />;
    // Marketing
    case "referral-sources":     return <ReferralSources />;
    case "campaign-tracking":    return <CampaignTracking />;
    case "patient-retention":    return <PatientRetention />;
    case "feedback-reviews":     return <FeedbackReviews />;
    case "membership-campaigns": return <MembershipCampaigns />;
    // Tasks
    case "task-list":        return <TaskList />;
    case "recurring-tasks":  return <RecurringTasks />;
    case "reminder-center":  return <ReminderCenter />;
    default:                 return <LeadDashboard onNavigate={onNavigate} />;
  }
}

// ─── CRM Page ─────────────────────────────────────────────────────────────────

export default function CRM() {
  const [active,   setActive]   = useState("lead-dashboard");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    leads: true, opportunities: false, communication: false, marketing: false, tasks: false,
  });

  const toggle = (sectionId: string) =>
    setExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const navigate = (itemId: string, sectionId: string) => {
    setActive(itemId);
    setExpanded(prev => ({ ...prev, [sectionId]: true }));
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1e2d5a]">CRM</h2>
          <p className="text-[10px] text-gray-400">Customer Relationship</p>
        </div>

        <nav className="flex-1 py-2">
          {NAV.map(section => (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-[#1e2d5a]">
                  {section.icon}
                  <span className="text-xs font-semibold">{section.label}</span>
                </div>
                {expanded[section.id]
                  ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
              </button>

              {/* Items */}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-5">
        {renderScreen(active, (page) => {
          const section = NAV.find(s => s.items.some(i => i.id === page));
          if (section) navigate(page, section.id);
        })}
      </main>
    </div>
  );
}
