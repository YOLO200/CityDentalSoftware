import { useState } from "react";
import { ChevronDown, X, Upload, Eye, EyeOff } from "lucide-react";

// ─── Page header ──────────────────────────────────────────────────────────────

export function SPageHeader({ title, subtitle, rightSlot }: {
  title: string; subtitle?: string; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-[#1e2d5a]">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}

// ─── Form card ────────────────────────────────────────────────────────────────

export function SFormCard({ title, children, className = "" }: {
  title?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 mb-4 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export function SInput({ label, value, onChange, required, placeholder = "", type = "text", className = "", readOnly = false }: {
  label?: string; value: string; onChange?: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string; className?: string; readOnly?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500 font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] focus:ring-1 focus:ring-[#1e2d5a]/20 transition ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""} ${isPassword ? "pr-9" : ""}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SSelect({ label, options, value, onChange, required, className = "" }: {
  label?: string; options: string[] | { value: string; label: string }[];
  value: string; onChange: (v: string) => void; required?: boolean; className?: string;
}) {
  const normalised = options.map(o => typeof o === "string" ? { value: o, label: o } : o);
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500 font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 pr-8 outline-none focus:border-[#1e2d5a] focus:ring-1 focus:ring-[#1e2d5a]/20 transition">
          {normalised.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function STextarea({ label, value, onChange, placeholder = "", rows = 3, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] resize-none transition" />
    </div>
  );
}

export function SColorInput({ label, value, onChange, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white w-fit">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-sm text-gray-700 font-mono">{value}</span>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function SToggle({ label, checked, onChange, description }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-[#1e2d5a]" : "bg-gray-300"}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function SaveButton({ onClick, loading = false, label = "SAVE CHANGES" }: {
  onClick: () => void; loading?: boolean; label?: string;
}) {
  return (
    <button onClick={onClick}
      className="bg-[#1e2d5a] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#1a2650] transition disabled:opacity-60"
      disabled={loading}>
      {loading ? "Saving..." : label}
    </button>
  );
}

export function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="border border-gray-300 text-gray-600 rounded-lg px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition">
      RESET
    </button>
  );
}

export function NewButton({ onClick, label = "+ Add" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="bg-[#1e2d5a] text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-[#1a2650] transition">
      {label}
    </button>
  );
}

export function DangerButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="border border-red-300 text-red-600 rounded-lg px-4 py-2 text-xs font-semibold hover:bg-red-50 transition">
      {label}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function STable({ columns, rows, loading = false }: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
  loading?: boolean;
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-10 border border-gray-200 rounded-lg">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
    </div>
  );
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map(col => (
              <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl opacity-20">📋</span>
                <p className="text-gray-300 text-sm">Nothing to show here</p>
              </div>
            </td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function STabs({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex border-b border-gray-200 mb-5">
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-5 py-2.5 text-sm font-medium transition-colors ${active === t ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function SModal({ title, open, onClose, children, width = "max-w-lg" }: {
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

// ─── Upload box ───────────────────────────────────────────────────────────────

export function SUploadBox({ label, hint = "PNG, JPG up to 2MB" }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-[#1e2d5a] transition cursor-pointer bg-gray-50">
        <Upload className="h-6 w-6 text-gray-400" />
        <p className="text-xs text-gray-500">Click to upload or drag & drop</p>
        <p className="text-[10px] text-gray-400">{hint}</p>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function SBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:   "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-500",
    Disabled: "bg-red-100 text-red-600",
    Pending:  "bg-amber-100 text-amber-700",
    Draft:    "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function SEmptyState({ message = "No records found", icon = "📋" }: { message?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-gray-200 rounded-xl">
      <span className="text-4xl opacity-20">{icon}</span>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

export function SDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Action button row ────────────────────────────────────────────────────────

export function SActionRow({ onSave, onReset, saving = false, saveLabel = "SAVE CHANGES" }: {
  onSave: () => void; onReset: () => void; saving?: boolean; saveLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-2">
      <SaveButton onClick={onSave} loading={saving} label={saveLabel} />
      <ResetBtn onClick={onReset} />
    </div>
  );
}

export const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
