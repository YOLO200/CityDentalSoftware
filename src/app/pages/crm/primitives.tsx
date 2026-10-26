import { useState } from "react";
import { ChevronDown, X, Filter, ArrowUpDown } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const LEAD_STATUSES  = ["New", "Contacted", "Interested", "Follow-up Pending", "Converted", "Lost"];
export const PRIORITIES     = ["High", "Medium", "Low"];
export const LEAD_SOURCES   = ["Instagram", "Facebook", "Google Ads", "Walk-in", "Doctor Referral", "Existing Patient", "Website", "WhatsApp", "Other"];
export const TREATMENTS     = ["Dental Implant", "Root Canal", "Braces / Aligners", "Teeth Whitening", "Crown & Bridge", "Scaling & Cleaning", "Veneers", "Full Mouth Rehab", "Extraction", "Dentures", "Other"];
export const BUDGET_RANGES  = ["< ₹5,000", "₹5,000–₹15,000", "₹15,000–₹30,000", "₹30,000–₹50,000", "> ₹50,000"];
export const OPP_STAGES     = ["New Inquiry", "Consultation Scheduled", "Treatment Discussed", "Negotiation", "Payment Pending", "Converted", "Lost"];
export const TASK_CATEGORIES= ["Follow-up Call", "Pending Consultation", "Overdue Payment", "Recall Appointment", "Other"];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  New:              "bg-blue-100 text-blue-700",
  Contacted:        "bg-indigo-100 text-indigo-700",
  Interested:       "bg-purple-100 text-purple-700",
  "Follow-up Pending": "bg-amber-100 text-amber-700",
  Converted:        "bg-green-100 text-green-700",
  Lost:             "bg-red-100 text-red-700",
  Pending:          "bg-amber-100 text-amber-700",
  "In Progress":    "bg-blue-100 text-blue-700",
  Completed:        "bg-green-100 text-green-700",
  Overdue:          "bg-red-100 text-red-700",
  Draft:            "bg-gray-100 text-gray-600",
  Scheduled:        "bg-purple-100 text-purple-700",
  Sent:             "bg-green-100 text-green-700",
  Failed:           "bg-red-100 text-red-700",
  Published:        "bg-green-100 text-green-700",
  Active:           "bg-green-100 text-green-700",
  Inactive:         "bg-gray-100 text-gray-500",
};

export function CRMStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    High:   "bg-red-100 text-red-700 border border-red-200",
    Medium: "bg-amber-100 text-amber-700 border border-amber-200",
    Low:    "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${map[priority] ?? "bg-gray-100 text-gray-500"}`}>
      {priority}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

export function KPICard({ label, value, sub, color = "text-[#1e2d5a]", icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function CRMPageHeader({ title, rightSlot }: { title: string; rightSlot?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-[#1e2d5a]">{title}</h2>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

export function PrimaryBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`bg-[#1e2d5a] text-white rounded px-4 py-2 text-xs font-medium hover:bg-[#1a2650] transition-colors ${className}`}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`border border-gray-300 text-gray-600 rounded px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${className}`}>
      {children}
    </button>
  );
}

// ─── Form inputs ──────────────────────────────────────────────────────────────

export function CInput({ label, value, onChange, required, placeholder = "", type = "text", className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
    </div>
  );
}

export function CSelect({ label, options, value, onChange, required, className = "" }: {
  label?: string; options: string[]; value: string; onChange: (v: string) => void;
  required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 pr-8 outline-none focus:border-[#1e2d5a]">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function CDate({ label, value, onChange, required, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
    </div>
  );
}

export function CTextarea({ label, value, onChange, placeholder = "", rows = 3, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] resize-none" />
    </div>
  );
}

// ─── CRM Table ────────────────────────────────────────────────────────────────

export function CRMTable({ columns, rows, loading = false }: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
  loading?: boolean;
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-16 border border-gray-200 rounded-lg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
    </div>
  );
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col} className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                <div className="flex items-center gap-1">{col}<Filter className="h-2.5 w-2.5 text-gray-300" /></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="text-gray-200 text-4xl">📋</div>
                <p className="text-gray-300 text-base">Looks like there's nothing to show here</p>
              </div>
            </td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

export function CRMFilterBar({ children, onView, onReset, rightSlot }: {
  children: React.ReactNode; onView: () => void; onReset: () => void; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-end gap-3">
      {children}
      <div className="flex items-end gap-2">
        <PrimaryBtn onClick={onView}>View</PrimaryBtn>
        <GhostBtn onClick={onReset}>Reset</GhostBtn>
      </div>
      {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CRMModal({ title, open, onClose, children, width = "max-w-xl" }: {
  title: string; open: boolean; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${width} mx-4 max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-[#1e2d5a]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Activity timeline ────────────────────────────────────────────────────────

export function ActivityTimeline({ items }: { items: { date: string; type: string; note: string; user: string }[] }) {
  const typeColor: Record<string, string> = {
    Call: "bg-blue-500", WhatsApp: "bg-green-500", Email: "bg-purple-500",
    Visit: "bg-amber-500", Note: "bg-gray-400", "Follow-up": "bg-orange-500",
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No activity yet</p>}
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${typeColor[item.type] ?? "bg-gray-400"}`} />
            {i < items.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold text-gray-700">{item.type}</span>
              <span className="text-[10px] text-gray-400">{item.date}</span>
              <span className="text-[10px] text-gray-400">by {item.user}</span>
            </div>
            <p className="text-xs text-gray-600">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

export function KanbanCard({ item, onMoveLeft, onMoveRight, stages, onEdit }: {
  item: any;
  onMoveLeft?: () => void; onMoveRight?: () => void;
  stages: string[]; onEdit?: () => void;
}) {
  const stageIdx = stages.indexOf(item.stage);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#1e2d5a] leading-tight">{item.title}</span>
        <PriorityBadge priority={item.priority} />
      </div>
      <div className="text-[10px] text-gray-500 space-y-0.5 mb-3">
        <div>💊 {item.treatment_type || "—"}</div>
        <div>👨‍⚕️ {item.doctor || "—"}</div>
        {item.estimated_value && <div>₹{Number(item.estimated_value).toLocaleString("en-IN")}</div>}
        {item.follow_up_date && <div>📅 {item.follow_up_date}</div>}
      </div>
      <div className="flex items-center gap-1 justify-end">
        {stageIdx > 0 && (
          <button onClick={onMoveLeft} className="text-[10px] text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100">← Back</button>
        )}
        {stageIdx < stages.length - 1 && (
          <button onClick={onMoveRight} className="text-[10px] bg-[#1e2d5a] text-white px-1.5 py-0.5 rounded hover:bg-[#1a2650]">Next →</button>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function CRMEmptyState({ message = "Looks like there's nothing to show here", icon = "📋" }: {
  message?: string; icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-5xl opacity-20">{icon}</span>
      <p className="text-gray-300 text-base">{message}</p>
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}

export const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
