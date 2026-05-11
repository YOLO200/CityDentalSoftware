import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown, ChevronRight, FileSpreadsheet, FileText, Printer,
  RotateCcw, Eye, MoreVertical, ArrowUpDown, Plus, HelpCircle,
  Filter, AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportId =
  | "receipts" | "daily-activity" | "dart" | "dr-occupancy"
  | "practice-summary" | "prospect-list" | "opportunities"
  | "patient-summary" | "referral-summary" | "patient-list"
  | "patient-contact" | "patients-period" | "birthday-list"
  | "anniversary-list" | "never-visited" | "membership-expiry"
  | "appt-scheduled" | "appt-booked"
  | "treatments-done" | "open-treatments" | "treatment-plans"
  | "conversion" | "patients-treatment" | "membership-treatment" | "prescription-list"
  | "sales" | "receivables" | "payables" | "settlements"
  | "ledger" | "day-book" | "insurance" | "voucher-list" | "expenses"
  | "inv-purchase" | "inv-consumption" | "item-purchase";

interface FilterState {
  from: string; to: string; preset: string; center: string; doctor: string;
  type?: string; voucherStatus?: string; groupByDate?: boolean;
  treatmentCategory?: string; status?: string; treatment?: string;
}

const NEEDS_TABLE: Partial<Record<ReportId, string>> = {};

const REPORT_TITLES: Record<ReportId, string> = {
  "receipts": "Receipts & Refunds", "daily-activity": "Daily Activity Details",
  "dart": "D.A.R.T. Report", "dr-occupancy": "Dr Occupancy",
  "practice-summary": "Practice Summary", "prospect-list": "Prospect List",
  "opportunities": "Opportunities List", "patient-summary": "Patient Summary",
  "referral-summary": "Referral Summary", "patient-list": "Patient List",
  "patient-contact": "Patient Contact List", "patients-period": "Patients in a Period",
  "birthday-list": "Birthday List", "anniversary-list": "Anniversary List",
  "never-visited": "Never Visited Patients", "membership-expiry": "Membership Expiry",
  "appt-scheduled": "Appointment List — By Scheduled Dates",
  "appt-booked": "Appointment List — By Booked-on Dates",
  "treatments-done": "Treatments Done", "open-treatments": "Open Treatments Report",
  "treatment-plans": "Treatment Plans", "conversion": "Conversion Report",
  "patients-treatment": "Patients for a Treatment",
  "membership-treatment": "Membership Treatment Expiry",
  "prescription-list": "Prescription List", "sales": "Sales & Sales Return",
  "receivables": "Receivables", "payables": "Payables", "settlements": "Settlements",
  "ledger": "Ledger", "day-book": "Day Book", "insurance": "Insurance Report",
  "voucher-list": "Voucher List", "expenses": "Expenses & Payments",
  "inv-purchase": "Inventory Purchase", "inv-consumption": "Inventory Consumption",
  "item-purchase": "Item Purchase & Consumption",
};

const SIDEBAR = [
  { title: "Summary", items: [
    { id: "receipts" as ReportId, label: "Receipts & Refunds" },
    { id: "daily-activity" as ReportId, label: "Daily Activity Details" },
    { id: "dart" as ReportId, label: "D.A.R.T. Report" },
    { id: "dr-occupancy" as ReportId, label: "Dr Occupancy" },
    { id: "practice-summary" as ReportId, label: "Practice Summary" },
    { id: "prospect-list" as ReportId, label: "Prospect List" },
    { id: "opportunities" as ReportId, label: "Opportunities List" },
  ]},
  { title: "Patients", items: [
    { id: "patient-summary" as ReportId, label: "Patient Summary" },
    { id: "referral-summary" as ReportId, label: "Referral Summary" },
    { id: "patient-list" as ReportId, label: "Patient List" },
    { id: "patient-contact" as ReportId, label: "Patient Contact List" },
    { id: "patients-period" as ReportId, label: "Patients in a Period" },
    { id: "birthday-list" as ReportId, label: "Birthday List" },
    { id: "anniversary-list" as ReportId, label: "Anniversary List" },
    { id: "never-visited" as ReportId, label: "Never Visited Patients" },
    { id: "membership-expiry" as ReportId, label: "Membership Expiry" },
  ]},
  { title: "Appointments", items: [
    { id: "appt-scheduled" as ReportId, label: "By Scheduled Dates" },
    { id: "appt-booked" as ReportId, label: "By Booked-on Dates" },
  ]},
  { title: "Treatments", items: [
    { id: "treatments-done" as ReportId, label: "Treatments Done" },
    { id: "open-treatments" as ReportId, label: "Open Treatments Report" },
    { id: "treatment-plans" as ReportId, label: "Treatment Plans" },
    { id: "conversion" as ReportId, label: "Conversion" },
    { id: "patients-treatment" as ReportId, label: "Patients for a Treatment" },
    { id: "membership-treatment" as ReportId, label: "Membership Treatment Expiry" },
    { id: "prescription-list" as ReportId, label: "Prescription List" },
  ]},
  { title: "Accounting", items: [
    { id: "sales" as ReportId, label: "Sales & Sales Return" },
    { id: "receivables" as ReportId, label: "Receivables" },
    { id: "payables" as ReportId, label: "Payables" },
    { id: "settlements" as ReportId, label: "Settlements" },
    { id: "ledger" as ReportId, label: "Ledger" },
    { id: "day-book" as ReportId, label: "Day Book" },
    { id: "insurance" as ReportId, label: "Insurance" },
    { id: "voucher-list" as ReportId, label: "Voucher List" },
    { id: "expenses" as ReportId, label: "Expenses & Payments" },
  ]},
  { title: "Inventory", items: [
    { id: "inv-purchase" as ReportId, label: "Inventory Purchase" },
    { id: "inv-consumption" as ReportId, label: "Inventory Consumption" },
    { id: "item-purchase" as ReportId, label: "Item Purchase & Consumption" },
  ]},
];

// ─── Shared hook: doctor profiles map ────────────────────────────────────────

function useDoctorMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from("profiles").select("id, name").then(({ data }) => {
      if (data) setMap(Object.fromEntries(data.map(p => [p.id, p.name as string])));
    });
  }, []);
  return map;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function FSelect({ label, options, value, onChange, className = "" }: {
  label?: string; options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      {label && <span className="block text-[10px] text-gray-400 mb-0.5">{label}</span>}
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 pr-6 outline-none focus:border-[#1e2d5a]">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function FDate({ label, value, onChange, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      {label && <span className="block text-[10px] text-gray-400 mb-0.5">{label}</span>}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#1e2d5a]" />
    </div>
  );
}

function ExportBar({ showNew = false }: { showNew?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {showNew && (
        <button className="flex items-center gap-1 bg-[#1e2d5a] text-white rounded px-3 py-1.5 text-xs hover:bg-[#1a2650]">
          <Plus className="h-3 w-3" /> New
        </button>
      )}
      <button title="Excel" className="border border-gray-300 rounded p-1.5 hover:bg-gray-50 text-green-700"><FileSpreadsheet className="h-3.5 w-3.5" /></button>
      <button title="PDF"   className="border border-gray-300 rounded p-1.5 hover:bg-gray-50 text-red-600"><FileText className="h-3.5 w-3.5" /></button>
      <button title="Print" className="border border-gray-300 rounded p-1.5 hover:bg-gray-50 text-gray-600"><Printer className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function Th({ children, sortable = false }: { children: React.ReactNode; sortable?: boolean }) {
  return (
    <th className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 text-left text-[11px] font-semibold text-gray-600 whitespace-nowrap z-10">
      <div className="flex items-center gap-1">
        {children}
        {sortable && <ArrowUpDown className="h-3 w-3 text-gray-400 cursor-pointer" />}
        <Filter className="h-3 w-3 text-gray-300 cursor-pointer ml-0.5" />
      </div>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-1.5 text-xs text-gray-700 border-b border-gray-100 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-lg text-gray-300">Looks like there's nothing to show here</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
    </div>
  );
}

function MissingTableBanner({ table }: { table: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-amber-800">Database table required</p>
        <p className="text-xs text-amber-700 mt-0.5">
          This report needs the <code className="bg-amber-100 px-1 rounded font-mono">{table}</code> table
          which doesn't exist yet. Create it in Supabase to enable this report.
        </p>
      </div>
    </div>
  );
}

function SummaryBox({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 p-4">
      <div className="text-xs font-semibold text-[#1e2d5a] mb-3">Report Summary</div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map(item => (
          <div key={item.label} className="flex flex-col">
            <span className="text-[10px] text-gray-500">{item.label}</span>
            <span className="text-sm font-semibold text-gray-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-green-100 text-green-700",
    Pending:   "bg-amber-100 text-amber-700",
    Completed: "bg-blue-100 text-blue-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  state, onChange, showType = false, showVoucherStatus = false, showGroupByDate = false,
  showTreatmentCategory = false, showStatus = false, showNew = false,
  showTreatmentSearch = false, onView, onReset,
}: {
  state: FilterState; onChange: (p: Partial<FilterState>) => void;
  showType?: boolean; showVoucherStatus?: boolean; showGroupByDate?: boolean;
  showTreatmentCategory?: boolean; showStatus?: boolean; showNew?: boolean;
  showTreatmentSearch?: boolean; onView: () => void; onReset: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
      <FDate label="From" value={state.from} onChange={v => onChange({ from: v })} />
      <FDate label="To"   value={state.to}   onChange={v => onChange({ to: v })} />
      <FSelect label="Preset" value={state.preset} onChange={v => onChange({ preset: v })} className="w-28"
        options={[
          { value: "today", label: "Today" }, { value: "yesterday", label: "Yesterday" },
          { value: "this-week", label: "This Week" }, { value: "this-month", label: "This Month" },
          { value: "custom", label: "Custom" },
        ]} />
      <FSelect label="Center" value={state.center} onChange={v => onChange({ center: v })} className="w-32"
        options={[
          { value: "all", label: "All Centers" }, { value: "Virani Chowk", label: "Virani Chowk" },
          { value: "Speedwell", label: "Speedwell" }, { value: "Kothariya", label: "Kothariya" },
        ]} />
      <FSelect label="Doctor" value={state.doctor} onChange={v => onChange({ doctor: v })} className="w-36"
        options={[{ value: "all", label: "All Doctors" }]} />
      {showType && (
        <FSelect label="Type" value={state.type ?? "all"} onChange={v => onChange({ type: v })} className="w-28"
          options={[{ value: "all", label: "All" }, { value: "receipt", label: "Receipt" }, { value: "refund", label: "Refund" }]} />
      )}
      {showVoucherStatus && (
        <FSelect label="Voucher Status" value={state.voucherStatus ?? "all"} onChange={v => onChange({ voucherStatus: v })} className="w-28"
          options={[{ value: "all", label: "All" }, { value: "regular", label: "Regular" }, { value: "cancelled", label: "Cancelled" }]} />
      )}
      {showTreatmentCategory && (
        <FSelect label="Treatment Category" value={state.treatmentCategory ?? "all"} onChange={v => onChange({ treatmentCategory: v })} className="w-36"
          options={[
            { value: "all", label: "All Categories" }, { value: "Preventive", label: "Preventive" },
            { value: "Restorative", label: "Restorative" }, { value: "Orthodontics", label: "Orthodontics" },
            { value: "Oral Surgery", label: "Oral Surgery" }, { value: "Emergency", label: "Emergency" },
          ]} />
      )}
      {showStatus && (
        <FSelect label="Status" value={state.status ?? "all"} onChange={v => onChange({ status: v })} className="w-28"
          options={[
            { value: "all", label: "All" }, { value: "Confirmed", label: "Confirmed" },
            { value: "Pending", label: "Pending" }, { value: "Completed", label: "Completed" },
            { value: "Cancelled", label: "Cancelled" },
          ]} />
      )}
      {showTreatmentSearch && (
        <div>
          <span className="block text-[10px] text-gray-400 mb-0.5">Treatment</span>
          <input placeholder="e.g. Scaling" value={state.treatment ?? ""}
            onChange={e => onChange({ treatment: e.target.value })}
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none w-36 focus:border-[#1e2d5a]" />
        </div>
      )}
      {showGroupByDate && (
        <label className="flex items-center gap-1.5 cursor-pointer pb-0.5">
          <input type="checkbox" checked={state.groupByDate ?? false}
            onChange={e => onChange({ groupByDate: e.target.checked })}
            className="accent-[#1e2d5a] w-3.5 h-3.5" />
          <span className="text-xs text-gray-600">Group by date</span>
        </label>
      )}
      <div className="flex items-end gap-2 ml-1">
        <button onClick={onView}
          className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs hover:bg-[#1a2650]">
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        <button onClick={onReset}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-xs hover:bg-gray-50">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        {showNew && (
          <button className="flex items-center gap-1 bg-[#1e2d5a] text-white rounded px-3 py-1.5 text-xs hover:bg-[#1a2650]">
            <Plus className="h-3 w-3" /> New
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared appointments fetcher ──────────────────────────────────────────────

interface ApptRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  treatment: string;
  status: string;
  notes: string | null;
  doctor_id: string;
  created_at: string;
  patient_name: string;
  patient_id: string;
  patient_phone: string;
  doctor_name: string;
}

async function fetchAppointments(filters: {
  from?: string; to?: string; status?: string; doctorId?: string;
  dateField?: "appointment_date" | "created_at";
}): Promise<ApptRow[]> {
  const field = filters.dateField ?? "appointment_date";

  let q = supabase.from("appointments")
    .select("id, appointment_date, start_time, end_time, treatment, status, notes, doctor_id, created_at, patient_id, patients!inner(first_name, last_name, phone)")
    .order(field, { ascending: false });

  if (filters.from) q = q.gte(field, filters.from);
  if (filters.to)   q = q.lte(field, filters.to);
  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.doctorId) q = q.eq("doctor_id", filters.doctorId);

  const { data: appts } = await q;
  if (!appts) return [];

  const { data: profiles } = await supabase.from("profiles").select("id, name");
  const doctorMap: Record<string, string> = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name as string]));

  return appts.map((a: any) => ({
    id: a.id,
    appointment_date: a.appointment_date,
    start_time: a.start_time,
    end_time: a.end_time,
    treatment: a.treatment,
    status: a.status,
    notes: a.notes,
    doctor_id: a.doctor_id,
    created_at: a.created_at,
    patient_name: `${a.patients.first_name} ${a.patients.last_name}`,
    patient_id: a.patient_id,
    patient_phone: a.patients.phone ?? "",
    doctor_name: doctorMap[a.doctor_id] ?? "—",
  }));
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function durationMins(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ─── Patient Summary ──────────────────────────────────────────────────────────

function PatientSummaryReport() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0, neverVisited: 0, withInsurance: 0 });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("id, is_active, last_dental_visit, created_at, insurance_provider");
    if (data) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      setStats({
        total: data.length,
        active: data.filter(p => p.is_active).length,
        inactive: data.filter(p => !p.is_active).length,
        newThisMonth: data.filter(p => p.created_at >= startOfMonth).length,
        neverVisited: data.filter(p => !p.last_dental_visit).length,
        withInsurance: data.filter(p => p.insurance_provider).length,
      });
    }
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); }} />
      {loading && <LoadingState />}
      {!loading && loaded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Patients",   value: stats.total,         color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Active",           value: stats.active,        color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Inactive",         value: stats.inactive,      color: "bg-gray-50 border-gray-200 text-gray-600" },
            { label: "New This Month",   value: stats.newThisMonth,  color: "bg-purple-50 border-purple-200 text-purple-700" },
            { label: "Never Visited",    value: stats.neverVisited,  color: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "With Insurance",   value: stats.withInsurance, color: "bg-teal-50 border-teal-200 text-teal-700" },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] mt-1 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && !loaded && <EmptyState />}
    </div>
  );
}

// ─── Referral Summary ─────────────────────────────────────────────────────────

function ReferralSummaryReport() {
  const [data, setData] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("referring_doctor, created_at")
      .not("referring_doctor", "is", null)
      .neq("referring_doctor", "");
    if (rows) {
      const counts: Record<string, number> = {};
      rows.forEach(r => { counts[r.referring_doctor] = (counts[r.referring_doctor] ?? 0) + 1; });
      setData(Object.entries(counts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count));
    }
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} referral sources` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr><Th>S.No</Th><Th>Referring Doctor / Source</Th><Th>Referral Count</Th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={3}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={3}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.source} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-medium text-blue-600">{r.source}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.count}</span>
                    <div className="h-1.5 rounded-full bg-[#1e2d5a] opacity-70" style={{ width: `${Math.min(r.count * 20, 120)}px` }} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Unique Sources", value: data.length },
          { label: "Total Referrals", value: data.reduce((s, r) => s + r.count, 0) },
        ]} />
      )}
    </div>
  );
}

// ─── Patient List ─────────────────────────────────────────────────────────────

function PatientListReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("patients")
      .select("id, first_name, last_name, gender, date_of_birth, phone, email, blood_group, is_active, created_at, last_dental_visit, balance_due, insurance_provider")
      .order("created_at", { ascending: false });
    if (filters.from) q = q.gte("created_at", filters.from);
    if (filters.to)   q = q.lte("created_at", filters.to + "T23:59:59");
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} records` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Gender</Th>
            <Th sortable>DOB</Th><Th>Phone</Th><Th>Email</Th>
            <Th>Blood Group</Th><Th>Insurance</Th><Th>Last Visit</Th>
            <Th>Balance</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={11}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td>{p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—"}</Td>
                <Td>{fmtDate(p.date_of_birth)}</Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td>{p.blood_group || "—"}</Td>
                <Td>{p.insurance_provider || "—"}</Td>
                <Td>{fmtDate(p.last_dental_visit)}</Td>
                <Td>{p.balance_due > 0 ? <span className="text-red-600 font-medium">₹{Number(p.balance_due).toLocaleString("en-IN")}</span> : <span className="text-gray-400">₹0</span>}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Active" : "Inactive"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Patient Contact List ─────────────────────────────────────────────────────

function PatientContactReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("id, first_name, last_name, phone, alternate_phone, email, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone")
      .order("first_name");
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} records` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Primary Phone</Th><Th>Alternate</Th>
            <Th>Email</Th><Th>Address</Th><Th>City</Th><Th>State</Th><Th>PIN</Th>
            <Th>Emergency Contact</Th><Th>Emergency Phone</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={11}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td><span className="font-mono">{p.alternate_phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td>{p.address || "—"}</Td>
                <Td>{p.city || "—"}</Td>
                <Td>{p.state || "—"}</Td>
                <Td>{p.zip_code || "—"}</Td>
                <Td>{p.emergency_contact_name || "—"}</Td>
                <Td><span className="font-mono">{p.emergency_contact_phone || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Patients in a Period ─────────────────────────────────────────────────────

function PatientsPeriodReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("patients")
      .select("id, first_name, last_name, phone, email, gender, is_active, created_at, first_visit_date")
      .order("created_at", { ascending: false });
    if (filters.from) q = q.gte("created_at", filters.from);
    if (filters.to)   q = q.lte("created_at", filters.to + "T23:59:59");
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} patients registered in period` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Phone</Th><Th>Email</Th>
            <Th>Gender</Th><Th sortable>Registered On</Th><Th>First Visit</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td>{p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—"}</Td>
                <Td>{fmtDate(p.created_at)}</Td>
                <Td>{fmtDate(p.first_visit_date)}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Active" : "Inactive"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "New Patients", value: data.length },
          { label: "Active", value: data.filter(p => p.is_active).length },
          { label: "Inactive", value: data.filter(p => !p.is_active).length },
        ]} />
      )}
    </div>
  );
}

// ─── Birthday List ────────────────────────────────────────────────────────────

function BirthdayListReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("id, first_name, last_name, phone, email, date_of_birth, is_active")
      .not("date_of_birth", "is", null).order("date_of_birth");
    const filtered = (rows ?? []).filter(p => {
      const dob = new Date(p.date_of_birth);
      return String(dob.getMonth() + 1).padStart(2, "0") === month;
    });
    setData(filtered);
    setLoading(false); setLoaded(true);
  }, [month]);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
        <FSelect label="Month" value={month} onChange={setMonth} className="w-32"
          options={monthNames.map((m, i) => ({ value: String(i + 1).padStart(2, "0"), label: m }))} />
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs hover:bg-[#1a2650]">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={() => { setLoaded(false); setData([]); }} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-xs hover:bg-gray-50">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} birthdays in ${monthNames[parseInt(month) - 1]}` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr><Th>S.No</Th><Th>Patient Name</Th><Th>Birthday</Th><Th>Phone</Th><Th>Email</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td>🎂 {new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Active" : "Inactive"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Anniversary List ─────────────────────────────────────────────────────────

function AnniversaryListReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("id, first_name, last_name, phone, email, anniversary_date, is_active")
      .not("anniversary_date", "is", null)
      .order("anniversary_date");
    const filtered = (rows ?? []).filter(p => {
      const d = new Date(p.anniversary_date);
      return String(d.getMonth() + 1).padStart(2, "0") === month;
    });
    setData(filtered);
    setLoading(false); setLoaded(true);
  }, [month]);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
        <FSelect label="Month" value={month} onChange={setMonth} className="w-32"
          options={monthNames.map((m, i) => ({ value: String(i + 1).padStart(2, "0"), label: m }))} />
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs hover:bg-[#1a2650]">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={() => { setLoaded(false); setData([]); }} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-xs hover:bg-gray-50">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} anniversaries in ${monthNames[parseInt(month) - 1]}` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Anniversary</Th>
            <Th>Phone</Th><Th>Email</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td>💍 {new Date(p.anniversary_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Active" : "Inactive"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Never Visited ────────────────────────────────────────────────────────────

function NeverVisitedReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("id, first_name, last_name, phone, email, created_at, is_active")
      .is("last_dental_visit", null)
      .order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} patients have never visited` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Phone</Th>
            <Th>Email</Th><Th sortable>Registered On</Th><Th>Status</Th>
            <th className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 z-10 w-8" />
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td>{fmtDate(p.created_at)}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.is_active ? "Active" : "Inactive"}</span></Td>
                <Td><button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-3.5 w-3.5" /></button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && <SummaryBox items={[{ label: "Never Visited Count", value: data.length }]} />}
    </div>
  );
}

// ─── Appointments table (shared by scheduled + booked) ───────────────────────

function AppointmentsTable({ dateField }: { dateField: "appointment_date" | "created_at" }) {
  const [data, setData] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all", status: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAppointments({
      from: filters.from, to: filters.to,
      status: filters.status, dateField,
    });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters, dateField]);

  const confirmed  = data.filter(a => a.status === "Confirmed").length;
  const completed  = data.filter(a => a.status === "Completed").length;
  const pending    = data.filter(a => a.status === "Pending").length;
  const cancelled  = data.filter(a => a.status === "Cancelled").length;
  const avgDur     = data.length ? Math.round(data.reduce((s, a) => s + durationMins(a.start_time, a.end_time), 0) / data.length) : 0;

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        showStatus showNew onView={load}
        onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} appointments` : ""}</span>
        <ExportBar showNew />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th sortable>Date</Th><Th>Start</Th><Th>End</Th><Th>Duration</Th>
            <Th>Doctor</Th><Th>Patient</Th><Th>Treatment</Th>
            <Th>Notes</Th><Th>Mobile</Th><Th>Status</Th>
            <th className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 z-10 w-8" />
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={11}><EmptyState /></td></tr>}
            {!loading && data.map((a, i) => (
              <tr key={a.id} className="hover:bg-blue-50/30">
                <Td>{fmtDate(a.appointment_date)}</Td>
                <Td><span className="font-mono">{fmtTime(a.start_time)}</span></Td>
                <Td><span className="font-mono">{fmtTime(a.end_time)}</span></Td>
                <Td>{durationMins(a.start_time, a.end_time)} min</Td>
                <Td><span className="text-[#1e2d5a] font-medium">{a.doctor_name}</span></Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{a.patient_name}</button></Td>
                <Td>{a.treatment}</Td>
                <Td><span className="text-gray-500 italic">{a.notes || "—"}</span></Td>
                <Td><span className="font-mono">{a.patient_phone || "—"}</span></Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td><button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-3.5 w-3.5" /></button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Total", value: data.length },
          { label: "Confirmed", value: confirmed },
          { label: "Completed", value: completed },
          { label: "Pending", value: pending },
          { label: "Cancelled", value: cancelled },
          { label: "Avg Duration", value: `${avgDur} min` },
        ]} />
      )}
    </div>
  );
}

// ─── Daily Activity ───────────────────────────────────────────────────────────

function DailyActivityReport() {
  const [data, setData] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAppointments({ from: date, to: date });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [date]);

  const byDoctor = Array.from(new Set(data.map(a => a.doctor_name))).map(doc => ({
    doctor: doc,
    count: data.filter(a => a.doctor_name === doc).length,
    completed: data.filter(a => a.doctor_name === doc && a.status === "Completed").length,
  }));

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
        <FDate label="Date" value={date} onChange={setDate} />
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs hover:bg-[#1a2650]">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={() => { setDate(today); setLoaded(false); setData([]); }} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-xs hover:bg-gray-50">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} appointments on ${fmtDate(date)}` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>Time</Th><Th>Doctor</Th><Th>Patient</Th>
            <Th>Treatment</Th><Th>Duration</Th><Th>Notes</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {!loading && data.map((a, i) => (
              <tr key={a.id} className="hover:bg-blue-50/30">
                <Td><span className="font-mono">{fmtTime(a.start_time)}</span></Td>
                <Td><span className="text-[#1e2d5a] font-medium">{a.doctor_name}</span></Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{a.patient_name}</button></Td>
                <Td>{a.treatment}</Td>
                <Td>{durationMins(a.start_time, a.end_time)} min</Td>
                <Td><span className="text-gray-500 italic">{a.notes || "—"}</span></Td>
                <Td><StatusBadge status={a.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && byDoctor.length > 0 && (
        <SummaryBox items={[
          { label: "Total Appointments", value: data.length },
          { label: "Completed", value: data.filter(a => a.status === "Completed").length },
          ...byDoctor.map(d => ({ label: `${d.doctor} (done)`, value: `${d.completed}/${d.count}` })),
        ]} />
      )}
    </div>
  );
}

// ─── DART Report ──────────────────────────────────────────────────────────────

function DartReport() {
  const [data, setData] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAppointments({ from: filters.from, to: filters.to });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const byDate = Array.from(new Set(data.map(a => a.appointment_date))).sort().map(date => ({
    date,
    total: data.filter(a => a.appointment_date === date).length,
    confirmed: data.filter(a => a.appointment_date === date && a.status === "Confirmed").length,
    completed: data.filter(a => a.appointment_date === date && a.status === "Completed").length,
    cancelled: data.filter(a => a.appointment_date === date && a.status === "Cancelled").length,
    pending:   data.filter(a => a.appointment_date === date && a.status === "Pending").length,
  }));

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${byDate.length} days` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th sortable>Date</Th><Th>Total</Th><Th>Confirmed</Th>
            <Th>Completed</Th><Th>Cancelled</Th><Th>Pending</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? byDate.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && byDate.map(d => (
              <tr key={d.date} className="hover:bg-blue-50/30">
                <Td><span className="font-medium">{fmtDate(d.date)}</span></Td>
                <Td><span className="font-semibold">{d.total}</span></Td>
                <Td><span className="text-green-700">{d.confirmed}</span></Td>
                <Td><span className="text-blue-700">{d.completed}</span></Td>
                <Td><span className="text-red-600">{d.cancelled}</span></Td>
                <Td><span className="text-amber-600">{d.pending}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Total Appointments", value: data.length },
          { label: "Confirmed", value: data.filter(a => a.status === "Confirmed").length },
          { label: "Completed", value: data.filter(a => a.status === "Completed").length },
          { label: "Cancelled", value: data.filter(a => a.status === "Cancelled").length },
          { label: "Pending",   value: data.filter(a => a.status === "Pending").length },
        ]} />
      )}
    </div>
  );
}

// ─── Dr Occupancy ─────────────────────────────────────────────────────────────

function DrOccupancyReport() {
  const [data, setData] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAppointments({ from: filters.from, to: filters.to });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const byDoctor = Array.from(new Set(data.map(a => a.doctor_name))).map(doc => {
    const appts = data.filter(a => a.doctor_name === doc);
    const totalMins = appts.reduce((s, a) => s + durationMins(a.start_time, a.end_time), 0);
    return {
      doctor: doc,
      total: appts.length,
      completed: appts.filter(a => a.status === "Completed").length,
      cancelled: appts.filter(a => a.status === "Cancelled").length,
      totalMins,
      avgMins: appts.length ? Math.round(totalMins / appts.length) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${byDoctor.length} doctors` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>Doctor</Th><Th>Total Appts</Th><Th>Completed</Th>
            <Th>Cancelled</Th><Th>Total Time</Th><Th>Avg Duration</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? byDoctor.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && byDoctor.map(d => (
              <tr key={d.doctor} className="hover:bg-blue-50/30">
                <Td><span className="font-semibold text-[#1e2d5a]">{d.doctor}</span></Td>
                <Td><span className="font-semibold">{d.total}</span></Td>
                <Td><span className="text-blue-700">{d.completed}</span></Td>
                <Td><span className="text-red-600">{d.cancelled}</span></Td>
                <Td>{Math.floor(d.totalMins / 60)}h {d.totalMins % 60}m</Td>
                <Td>{d.avgMins} min</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Practice Summary ─────────────────────────────────────────────────────────

function PracticeSummaryReport() {
  const [appts, setAppts] = useState<ApptRow[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const [rows, { data: pts }] = await Promise.all([
      fetchAppointments({ from: filters.from, to: filters.to }),
      supabase.from("patients").select("id, is_active, created_at").gte("created_at", filters.from + "T00:00:00").lte("created_at", filters.to + "T23:59:59"),
    ]);
    setAppts(rows);
    setPatients(pts ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); }} />
      {loading && <LoadingState />}
      {!loading && loaded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "New Patients",        value: patients.length,                                              color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "Total Appointments",  value: appts.length,                                                 color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
              { label: "Completed",           value: appts.filter(a => a.status === "Completed").length,           color: "bg-green-50 border-green-200 text-green-700" },
              { label: "Cancellation Rate",   value: appts.length ? `${Math.round(appts.filter(a => a.status === "Cancelled").length / appts.length * 100)}%` : "0%", color: "bg-red-50 border-red-200 text-red-700" },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-[11px] mt-1 opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
          <SummaryBox items={[
            { label: "Avg Appts/Day", value: appts.length && filters.from !== filters.to ? Math.round(appts.length / Math.max(1, Math.ceil((new Date(filters.to).getTime() - new Date(filters.from).getTime()) / 86400000))) : appts.length },
            { label: "Pending",   value: appts.filter(a => a.status === "Pending").length },
            { label: "Confirmed", value: appts.filter(a => a.status === "Confirmed").length },
          ]} />
        </div>
      )}
      {!loading && !loaded && <EmptyState />}
    </div>
  );
}

// ─── Treatments Done / Open / Plans / Patients for Treatment ─────────────────

function TreatmentReport({ mode }: { mode: "done" | "open" | "plans" | "by-treatment" }) {
  const [data, setData] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all", treatment: "",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const statusFilter = mode === "done" ? "Completed" : mode === "open" ? undefined : undefined;
    let rows = await fetchAppointments({ from: filters.from, to: filters.to, status: statusFilter ?? "all" });
    if (mode === "open")         rows = rows.filter(a => a.status !== "Completed" && a.status !== "Cancelled");
    if (mode === "by-treatment" && filters.treatment) rows = rows.filter(a => a.treatment.toLowerCase().includes((filters.treatment ?? "").toLowerCase()));
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters, mode]);

  const byTreatment = Array.from(new Set(data.map(a => a.treatment))).map(t => ({
    treatment: t,
    count: data.filter(a => a.treatment === t).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        showTreatmentSearch={mode === "by-treatment"}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} records` : ""}</span>
        <ExportBar />
      </div>

      {mode === "by-treatment" && loaded && data.length > 0 && (
        <div className="mt-2 mb-3 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead><tr><Th>Treatment</Th><Th>Patient Count</Th></tr></thead>
            <tbody>
              {byTreatment.map(t => (
                <tr key={t.treatment} className="hover:bg-blue-50/30">
                  <Td><span className="font-medium">{t.treatment}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.count}</span>
                      <div className="h-1.5 rounded-full bg-[#1e2d5a] opacity-60" style={{ width: `${Math.min(t.count * 15, 100)}px` }} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th sortable>Date</Th><Th>Doctor</Th><Th>Patient</Th>
            <Th>Treatment</Th><Th>Duration</Th><Th>Notes</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {!loading && data.map((a, i) => (
              <tr key={a.id} className="hover:bg-blue-50/30">
                <Td>{fmtDate(a.appointment_date)}</Td>
                <Td><span className="text-[#1e2d5a] font-medium">{a.doctor_name}</span></Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{a.patient_name}</button></Td>
                <Td>{a.treatment}</Td>
                <Td>{durationMins(a.start_time, a.end_time)} min</Td>
                <Td><span className="text-gray-500 italic">{a.notes || "—"}</span></Td>
                <Td><StatusBadge status={a.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Conversion Report ────────────────────────────────────────────────────────

function ConversionReport() {
  const [data, setData] = useState<{ doctor: string; total: number; completed: number; rate: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAppointments({ from: filters.from, to: filters.to });
    const byDoctor = Array.from(new Set(rows.map(a => a.doctor_name))).map(doc => {
      const appts = rows.filter(a => a.doctor_name === doc);
      const completed = appts.filter(a => a.status === "Completed").length;
      return { doctor: doc, total: appts.length, completed, rate: appts.length ? Math.round(completed / appts.length * 100) : 0 };
    }).sort((a, b) => b.rate - a.rate);
    setData(byDoctor);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} doctors` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr><Th>Doctor</Th><Th>Total Appointments</Th><Th>Completed</Th><Th>Conversion Rate</Th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={4}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={4}><EmptyState /></td></tr>}
            {!loading && data.map(d => (
              <tr key={d.doctor} className="hover:bg-blue-50/30">
                <Td><span className="font-semibold text-[#1e2d5a]">{d.doctor}</span></Td>
                <Td>{d.total}</Td>
                <Td>{d.completed}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${d.rate >= 70 ? "text-green-600" : d.rate >= 40 ? "text-amber-600" : "text-red-500"}`}>{d.rate}%</span>
                    <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.rate >= 70 ? "bg-green-500" : d.rate >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${d.rate}%` }} />
                    </div>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared receipts fetcher ─────────────────────────────────────────────────

interface ReceiptRow {
  id: string; receipt_number: string; type: string; date: string;
  amount: number; paid_by: string; notes: string | null;
  status: string; insurance_claim: boolean;
  insurance_provider: string | null; policy_number: string | null;
  doctor_id: string; patient_id: string;
  patient_name: string; doctor_name: string;
}

async function fetchReceipts(filters: {
  from?: string; to?: string; type?: string;
  status?: string; insuranceOnly?: boolean; doctorId?: string;
}): Promise<ReceiptRow[]> {
  let q = supabase.from("receipts")
    .select("id, receipt_number, type, date, amount, paid_by, notes, status, insurance_claim, insurance_provider, policy_number, doctor_id, patient_id, patients!inner(first_name, last_name)")
    .order("date", { ascending: false });
  if (filters.from) q = q.gte("date", filters.from);
  if (filters.to)   q = q.lte("date", filters.to);
  if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.insuranceOnly) q = q.eq("insurance_claim", true);
  const { data: rows } = await q;
  if (!rows) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, name");
  const doctorMap: Record<string, string> = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name as string]));
  return rows.map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    patient_name: `${r.patients.first_name} ${r.patients.last_name}`,
    doctor_name: doctorMap[r.doctor_id] ?? "—",
  }));
}

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── Receipts & Refunds ───────────────────────────────────────────────────────

function ReceiptsReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all", type: "all", voucherStatus: "all", groupByDate: false,
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to, type: filters.type, status: filters.voucherStatus });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const totalAmt    = data.reduce((s, r) => s + r.amount, 0);
  const totalCash   = data.filter(r => r.paid_by === "Cash").reduce((s, r) => s + r.amount, 0);
  const totalOnline = data.filter(r => r.paid_by === "Chq/Online").reduce((s, r) => s + r.amount, 0);
  const totalCard   = data.filter(r => r.paid_by === "Card").reduce((s, r) => s + r.amount, 0);
  const totalWallet = data.filter(r => r.paid_by === "Wallet").reduce((s, r) => s + r.amount, 0);
  const totalOthers = data.filter(r => r.paid_by === "Others").reduce((s, r) => s + r.amount, 0);
  const byDoctor    = Array.from(new Set(data.map(r => r.doctor_name))).map(doc => ({
    doctor: doc, total: data.filter(r => r.doctor_name === doc).reduce((s, r) => s + r.amount, 0),
  }));

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        showType showVoucherStatus showGroupByDate
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} records` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Receipt #</Th><Th sortable>Date</Th>
            <Th>Patient Name</Th><Th>Amount</Th><Th>Paid By</Th>
            <Th>Notes</Th><Th>Doctor</Th><Th>Status</Th>
            <th className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 z-10 w-8" />
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={10}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={10}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${r.type === "Refund" ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"}`}>{r.receipt_number}</span></Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{r.patient_name}</button></Td>
                <Td><span className={r.amount < 0 ? "text-red-600 font-medium" : "font-medium"}>{r.amount < 0 ? `- ${fmt(r.amount)}` : fmt(r.amount)}</span></Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.paid_by === "Cash" ? "bg-green-100 text-green-700" : r.paid_by === "Card" ? "bg-blue-100 text-blue-700" : r.paid_by === "Wallet" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>{r.paid_by}</span></Td>
                <Td><span className="text-gray-500 italic">{r.notes || "—"}</span></Td>
                <Td>{r.doctor_name}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "Regular" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"}`}>{r.status}</span></Td>
                <Td><button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-3.5 w-3.5" /></button></Td>
              </tr>
            ))}
          </tbody>
          {loaded && data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td colSpan={4} className="px-3 py-2 text-xs text-right text-gray-600">Totals</td>
                <td className="px-3 py-2 text-xs font-bold">{fmt(totalAmt)}</td>
                <td colSpan={5} className="px-3 py-2 text-xs text-gray-500">
                  Cash: {fmt(totalCash)} | Chq/Online: {fmt(totalOnline)} | Card: {fmt(totalCard)} | Wallet: {fmt(totalWallet)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Count", value: data.length },
          { label: "Total Amount", value: fmt(totalAmt) },
          { label: "Cash", value: fmt(totalCash) },
          { label: "Chq/Online", value: fmt(totalOnline) },
          { label: "Card", value: fmt(totalCard) },
          { label: "Wallet", value: fmt(totalWallet) },
          { label: "Others", value: fmt(totalOthers) },
          ...byDoctor.map(d => ({ label: d.doctor, value: fmt(d.total) })),
        ]} />
      )}
    </div>
  );
}

// ─── Sales & Sales Return ─────────────────────────────────────────────────────

function SalesReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const sales    = data.filter(r => r.type === "Receipt");
  const returns  = data.filter(r => r.type === "Refund");
  const netTotal = data.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} transactions` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Voucher #</Th><Th sortable>Date</Th><Th>Type</Th>
            <Th>Patient</Th><Th>Doctor</Th><Th>Amount</Th><Th>Paid By</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-mono text-xs">{r.receipt_number}</span></Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.type === "Receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.type}</span></Td>
                <Td><button className="text-blue-600 hover:underline">{r.patient_name}</button></Td>
                <Td>{r.doctor_name}</Td>
                <Td><span className={r.amount < 0 ? "text-red-600 font-medium" : "font-medium"}>{fmt(r.amount)}</span></Td>
                <Td>{r.paid_by}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Sales Count", value: sales.length },
          { label: "Total Sales", value: fmt(sales.reduce((s, r) => s + r.amount, 0)) },
          { label: "Returns Count", value: returns.length },
          { label: "Total Returns", value: fmt(Math.abs(returns.reduce((s, r) => s + r.amount, 0))) },
          { label: "Net Total", value: fmt(netTotal) },
        ]} />
      )}
    </div>
  );
}

// ─── Receivables ──────────────────────────────────────────────────────────────

function ReceivablesReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("patients")
      .select("id, first_name, last_name, phone, email, balance_due, insurance_provider")
      .gt("balance_due", 0).order("balance_due", { ascending: false });
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, []);

  const total = data.reduce((s, p) => s + Number(p.balance_due), 0);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} patients with outstanding balance` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient Name</Th><Th>Phone</Th>
            <Th>Email</Th><Th>Insurance</Th><Th>Balance Due</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.first_name} {p.last_name}</button></Td>
                <Td><span className="font-mono">{p.phone || "—"}</span></Td>
                <Td>{p.email || "—"}</Td>
                <Td>{p.insurance_provider || "—"}</Td>
                <Td><span className="text-red-600 font-semibold">{fmt(Number(p.balance_due))}</span></Td>
              </tr>
            ))}
          </tbody>
          {loaded && data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-right text-gray-600">Total Receivable</td>
                <td className="px-3 py-2 text-xs font-bold text-red-600">{fmt(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {loaded && data.length > 0 && <SummaryBox items={[{ label: "Patients with Dues", value: data.length }, { label: "Total Receivable", value: fmt(total) }]} />}
    </div>
  );
}

// ─── Payables ─────────────────────────────────────────────────────────────────

function PayablesReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to, type: "Refund" });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} refunds` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Voucher #</Th><Th sortable>Date</Th>
            <Th>Patient</Th><Th>Amount</Th><Th>Paid By</Th><Th>Notes</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-mono text-xs">{r.receipt_number}</span></Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><button className="text-blue-600 hover:underline">{r.patient_name}</button></Td>
                <Td><span className="text-red-600 font-medium">{fmt(Math.abs(r.amount))}</span></Td>
                <Td>{r.paid_by}</Td>
                <Td><span className="text-gray-500 italic">{r.notes || "—"}</span></Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "Regular" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"}`}>{r.status}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && <SummaryBox items={[{ label: "Total Refunds", value: data.length }, { label: "Total Amount", value: fmt(Math.abs(data.reduce((s, r) => s + r.amount, 0))) }]} />}
    </div>
  );
}

// ─── Settlements ──────────────────────────────────────────────────────────────

function SettlementsReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to, type: "Receipt" });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const modes = ["Cash", "Card", "Wallet", "Chq/Online", "Others"];
  const byMode = modes.map(m => ({
    mode: m,
    count: data.filter(r => r.paid_by === m).length,
    total: data.filter(r => r.paid_by === m).reduce((s, r) => s + r.amount, 0),
  })).filter(m => m.count > 0);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} settlements` : ""}</span>
        <ExportBar />
      </div>
      {loaded && data.length > 0 && (
        <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead><tr><Th>Payment Mode</Th><Th>Count</Th><Th>Total Amount</Th></tr></thead>
            <tbody>
              {byMode.map(m => (
                <tr key={m.mode} className="hover:bg-blue-50/30">
                  <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.mode === "Cash" ? "bg-green-100 text-green-700" : m.mode === "Card" ? "bg-blue-100 text-blue-700" : m.mode === "Wallet" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>{m.mode}</span></Td>
                  <Td>{m.count}</Td>
                  <Td><span className="font-semibold">{fmt(m.total)}</span></Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                <td className="px-3 py-2 text-xs text-right text-gray-600">Total</td>
                <td className="px-3 py-2 text-xs">{data.length}</td>
                <td className="px-3 py-2 text-xs font-bold">{fmt(data.reduce((s, r) => s + r.amount, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {!loaded && <div className="mt-2 border border-gray-200 rounded-lg bg-white"><EmptyState /></div>}
      {loading && <LoadingState />}
    </div>
  );
}

// ─── Day Book ─────────────────────────────────────────────────────────────────

function DayBookReport() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    setLoading(true);
    const [recs, { data: exps }] = await Promise.all([
      fetchReceipts({ from: date, to: date }),
      supabase.from("expenses").select("*").eq("date", date).order("created_at"),
    ]);
    setReceipts(recs);
    setExpenses(exps ?? []);
    setLoading(false); setLoaded(true);
  }, [date]);

  const totalIn  = receipts.filter(r => r.type === "Receipt").reduce((s, r) => s + r.amount, 0);
  const totalOut = receipts.filter(r => r.type === "Refund").reduce((s, r) => s + Math.abs(r.amount), 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net      = totalIn - totalOut - totalExp;

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
        <FDate label="Date" value={date} onChange={setDate} />
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-1.5 text-xs hover:bg-[#1a2650]"><Eye className="h-3.5 w-3.5" /> View</button>
          <button onClick={() => { setLoaded(false); }} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-xs hover:bg-gray-50"><RotateCcw className="h-3 w-3" /> Reset</button>
        </div>
      </div>
      {loading && <LoadingState />}
      {loaded && (
        <div className="mt-3 space-y-3">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Receipts — {fmtDate(date)}</div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse">
              <thead><tr><Th>Voucher #</Th><Th>Type</Th><Th>Patient</Th><Th>Amount</Th><Th>Paid By</Th><Th>Notes</Th></tr></thead>
              <tbody>
                {receipts.length === 0 ? <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400">No receipts</td></tr>
                  : receipts.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30">
                      <Td><span className="font-mono text-xs">{r.receipt_number}</span></Td>
                      <Td><span className={`px-1.5 py-0.5 rounded text-[10px] ${r.type === "Receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.type}</span></Td>
                      <Td><button className="text-blue-600 hover:underline">{r.patient_name}</button></Td>
                      <Td><span className={r.amount < 0 ? "text-red-600 font-medium" : "font-medium"}>{fmt(Math.abs(r.amount))}</span></Td>
                      <Td>{r.paid_by}</Td>
                      <Td><span className="text-gray-500 italic">{r.notes || "—"}</span></Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-3">Expenses — {fmtDate(date)}</div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse">
              <thead><tr><Th>Category</Th><Th>Description</Th><Th>Vendor</Th><Th>Amount</Th><Th>Paid By</Th></tr></thead>
              <tbody>
                {expenses.length === 0 ? <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-400">No expenses</td></tr>
                  : expenses.map(e => (
                    <tr key={e.id} className="hover:bg-blue-50/30">
                      <Td>{e.category}</Td><Td>{e.description || "—"}</Td>
                      <Td>{e.vendor || "—"}</Td>
                      <Td><span className="text-red-600 font-medium">{fmt(Number(e.amount))}</span></Td>
                      <Td>{e.paid_by}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <SummaryBox items={[
            { label: "Total Receipts In", value: fmt(totalIn) },
            { label: "Total Refunds Out", value: fmt(totalOut) },
            { label: "Total Expenses", value: fmt(totalExp) },
            { label: "Net Balance", value: fmt(net) },
          ]} />
        </div>
      )}
      {!loading && !loaded && <div className="mt-2 border border-gray-200 rounded-lg bg-white"><EmptyState /></div>}
    </div>
  );
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

function LedgerReport() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const [recs, { data: exps }] = await Promise.all([
      fetchReceipts({ from: filters.from, to: filters.to }),
      supabase.from("expenses").select("*").gte("date", filters.from).lte("date", filters.to).order("date"),
    ]);
    setReceipts(recs);
    setExpenses(exps ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  type LedgerEntry = { date: string; description: string; debit: number; credit: number; type: string };
  const entries: LedgerEntry[] = [
    ...receipts.map(r => ({ date: r.date, description: `${r.type} — ${r.patient_name} (${r.receipt_number})`, debit: r.type === "Refund" ? Math.abs(r.amount) : 0, credit: r.type === "Receipt" ? r.amount : 0, type: r.type })),
    ...expenses.map(e => ({ date: e.date, description: `Expense — ${e.category}: ${e.description || ""}`, debit: Number(e.amount), credit: 0, type: "Expense" })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const withBalance = entries.map(e => { running += e.credit - e.debit; return { ...e, balance: running }; });

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${entries.length} entries` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr><Th sortable>Date</Th><Th>Description</Th><Th>Type</Th><Th>Debit</Th><Th>Credit</Th><Th>Balance</Th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><LoadingState /></td></tr>}
            {!loading && (loaded ? withBalance.length === 0 : true) && <tr><td colSpan={6}><EmptyState /></td></tr>}
            {!loading && withBalance.map((e, i) => (
              <tr key={i} className="hover:bg-blue-50/30">
                <Td>{fmtDate(e.date)}</Td>
                <Td><span className="max-w-xs truncate block">{e.description}</span></Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${e.type === "Receipt" ? "bg-green-100 text-green-700" : e.type === "Refund" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{e.type}</span></Td>
                <Td>{e.debit > 0 ? <span className="text-red-600">{fmt(e.debit)}</span> : "—"}</Td>
                <Td>{e.credit > 0 ? <span className="text-green-600">{fmt(e.credit)}</span> : "—"}</Td>
                <Td><span className={`font-semibold ${e.balance >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(e.balance)}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Insurance ────────────────────────────────────────────────────────────────

function InsuranceReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to, insuranceOnly: true });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} insurance claims` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Voucher #</Th><Th sortable>Date</Th>
            <Th>Patient</Th><Th>Insurance Provider</Th><Th>Policy #</Th>
            <Th>Amount</Th><Th>Paid By</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-mono text-xs">{r.receipt_number}</span></Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><button className="text-blue-600 hover:underline">{r.patient_name}</button></Td>
                <Td>{r.insurance_provider || "—"}</Td>
                <Td><span className="font-mono text-xs">{r.policy_number || "—"}</span></Td>
                <Td><span className="font-medium">{fmt(r.amount)}</span></Td>
                <Td>{r.paid_by}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && <SummaryBox items={[{ label: "Total Claims", value: data.length }, { label: "Total Amount", value: fmt(data.reduce((s, r) => s + r.amount, 0)) }]} />}
    </div>
  );
}

// ─── Voucher List ─────────────────────────────────────────────────────────────

function VoucherListReport() {
  const [data, setData] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
    voucherStatus: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchReceipts({ from: filters.from, to: filters.to, status: filters.voucherStatus });
    setData(rows);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        showVoucherStatus onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} vouchers` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Voucher #</Th><Th sortable>Date</Th><Th>Type</Th>
            <Th>Patient</Th><Th>Doctor</Th><Th>Amount</Th><Th>Paid By</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={9}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-mono text-xs">{r.receipt_number}</span></Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.type === "Receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.type}</span></Td>
                <Td><button className="text-blue-600 hover:underline">{r.patient_name}</button></Td>
                <Td>{r.doctor_name}</Td>
                <Td><span className="font-medium">{fmt(Math.abs(r.amount))}</span></Td>
                <Td>{r.paid_by}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "Regular" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"}`}>{r.status}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Expenses & Payments ──────────────────────────────────────────────────────

function ExpensesReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("expenses").select("*").order("date", { ascending: false });
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to)   q = q.lte("date", filters.to);
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const total = data.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = Array.from(new Set(data.map(e => e.category))).map(cat => ({
    cat, total: data.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} expenses` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th sortable>Date</Th><Th>Category</Th>
            <Th>Description</Th><Th>Vendor</Th><Th>Amount</Th><Th>Paid By</Th><Th>Ref</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((e, i) => (
              <tr key={e.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td>{fmtDate(e.date)}</Td>
                <Td><span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-medium">{e.category}</span></Td>
                <Td>{e.description || "—"}</Td>
                <Td>{e.vendor || "—"}</Td>
                <Td><span className="text-red-600 font-medium">{fmt(Number(e.amount))}</span></Td>
                <Td>{e.paid_by}</Td>
                <Td><span className="font-mono text-xs text-gray-400">{e.reference || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
          {loaded && data.length > 0 && (
            <tfoot><tr className="bg-gray-50 border-t-2 border-gray-300">
              <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-right text-gray-600">Total</td>
              <td className="px-3 py-2 text-xs font-bold text-red-600">{fmt(total)}</td>
              <td colSpan={2} />
            </tr></tfoot>
          )}
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Total Expenses", value: fmt(total) },
          ...byCategory.map(c => ({ label: c.cat, value: fmt(c.total) })),
        ]} />
      )}
    </div>
  );
}

// ─── Membership Expiry ────────────────────────────────────────────────────────

function MembershipExpiryReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: now.toISOString().split("T")[0],
    to: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split("T")[0],
    preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("memberships")
      .select("*, patients!inner(first_name, last_name, phone, email)")
      .order("end_date");
    if (filters.from) q = q.gte("end_date", filters.from);
    if (filters.to)   q = q.lte("end_date", filters.to);
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} memberships expiring` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient</Th><Th>Phone</Th><Th>Plan</Th>
            <Th>Start Date</Th><Th sortable>End Date</Th><Th>Amount</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((m, i) => (
              <tr key={m.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{m.patients.first_name} {m.patients.last_name}</button></Td>
                <Td><span className="font-mono">{m.patients.phone || "—"}</span></Td>
                <Td><span className="font-medium">{m.plan_name}</span></Td>
                <Td>{fmtDate(m.start_date)}</Td>
                <Td>{fmtDate(m.end_date)}</Td>
                <Td>{fmt(Number(m.amount))}</Td>
                <Td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.status === "Active" ? "bg-green-100 text-green-700" : m.status === "Expired" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Membership Treatment Expiry ──────────────────────────────────────────────

function MembershipTreatmentReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("memberships")
      .select("*, patients!inner(first_name, last_name, phone)")
      .eq("status", "Active").order("end_date");
    const nearExpiry = (rows ?? []).filter(m =>
      Array.isArray(m.treatments_included) &&
      m.treatments_used >= m.treatments_included.length
    );
    setData(nearExpiry);
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} memberships with treatments exhausted` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Patient</Th><Th>Phone</Th><Th>Plan</Th>
            <Th>Treatments Included</Th><Th>Treatments Used</Th><Th>Expiry</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {!loading && data.map((m, i) => (
              <tr key={m.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{m.patients.first_name} {m.patients.last_name}</button></Td>
                <Td><span className="font-mono">{m.patients.phone || "—"}</span></Td>
                <Td>{m.plan_name}</Td>
                <Td>{Array.isArray(m.treatments_included) ? m.treatments_included.length : "—"}</Td>
                <Td><span className="font-semibold text-red-600">{m.treatments_used}</span></Td>
                <Td>{fmtDate(m.end_date)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Prescription List ────────────────────────────────────────────────────────

function PrescriptionListReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("prescriptions")
      .select("*, patients!inner(first_name, last_name, phone)")
      .order("date", { ascending: false });
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to)   q = q.lte("date", filters.to);
    const { data: rows } = await q;
    if (!rows) { setData([]); setLoading(false); setLoaded(true); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    const doctorMap: Record<string, string> = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name as string]));
    setData(rows.map((r: any) => ({ ...r, doctor_name: doctorMap[r.doctor_id] ?? "—", patient_name: `${r.patients.first_name} ${r.patients.last_name}`, patient_phone: r.patients.phone })));
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} prescriptions` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th sortable>Date</Th><Th>Patient</Th><Th>Doctor</Th>
            <Th>Drug</Th><Th>Dosage</Th><Th>Duration</Th><Th>Qty</Th><Th>Instructions</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={9}><EmptyState /></td></tr>}
            {!loading && data.map((p, i) => (
              <tr key={p.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td>{fmtDate(p.date)}</Td>
                <Td><button className="text-blue-600 hover:underline font-medium">{p.patient_name}</button></Td>
                <Td>{p.doctor_name}</Td>
                <Td><span className="font-medium">{p.drug_name}</span></Td>
                <Td>{p.dosage || "—"}</Td>
                <Td>{p.duration || "—"}</Td>
                <Td>{p.quantity || "—"}</Td>
                <Td><span className="text-gray-500 italic">{p.instructions || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inventory Purchase ───────────────────────────────────────────────────────

function InventoryPurchaseReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("inventory_transactions")
      .select("*, inventory_items!inner(item_name, category, unit)")
      .eq("type", "Purchase").order("date", { ascending: false });
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to)   q = q.lte("date", filters.to);
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  const total = data.reduce((s, r) => s + Number(r.total_cost ?? 0), 0);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} purchase records` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th sortable>Date</Th><Th>Item</Th><Th>Category</Th>
            <Th>Qty</Th><Th>Unit</Th><Th>Unit Cost</Th><Th>Total</Th>
            <Th>Vendor</Th><Th>Invoice #</Th><Th>Expiry</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={11}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><span className="font-medium">{r.inventory_items.item_name}</span></Td>
                <Td>{r.inventory_items.category || "—"}</Td>
                <Td>{r.quantity}</Td>
                <Td>{r.inventory_items.unit || "—"}</Td>
                <Td>{r.unit_cost ? fmt(Number(r.unit_cost)) : "—"}</Td>
                <Td><span className="font-medium">{fmt(Number(r.total_cost ?? 0))}</span></Td>
                <Td>{r.vendor || "—"}</Td>
                <Td><span className="font-mono text-xs text-gray-400">{r.invoice_number || "—"}</span></Td>
                <Td>{fmtDate(r.expiry_date)}</Td>
              </tr>
            ))}
          </tbody>
          {loaded && data.length > 0 && (
            <tfoot><tr className="bg-gray-50 border-t-2 border-gray-300">
              <td colSpan={7} className="px-3 py-2 text-xs font-semibold text-right text-gray-600">Total</td>
              <td className="px-3 py-2 text-xs font-bold">{fmt(total)}</td>
              <td colSpan={3} />
            </tr></tfoot>
          )}
        </table>
      </div>
      {loaded && data.length > 0 && <SummaryBox items={[{ label: "Purchase Records", value: data.length }, { label: "Total Cost", value: fmt(total) }]} />}
    </div>
  );
}

// ─── Inventory Consumption ────────────────────────────────────────────────────

function InventoryConsumptionReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("inventory_transactions")
      .select("*, inventory_items!inner(item_name, category, unit)")
      .eq("type", "Consumption").order("date", { ascending: false });
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to)   q = q.lte("date", filters.to);
    const { data: rows } = await q;
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} consumption records` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th sortable>Date</Th><Th>Item</Th><Th>Category</Th>
            <Th>Qty Used</Th><Th>Unit</Th><Th>Notes</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={7}><EmptyState /></td></tr>}
            {!loading && data.map((r, i) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td><span className="font-medium">{r.inventory_items.item_name}</span></Td>
                <Td>{r.inventory_items.category || "—"}</Td>
                <Td><span className="font-semibold text-amber-600">{r.quantity}</span></Td>
                <Td>{r.inventory_items.unit || "—"}</Td>
                <Td><span className="text-gray-500 italic">{r.notes || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Item Purchase & Consumption ──────────────────────────────────────────────

function ItemPurchaseConsumptionReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const now = new Date();
  const defaultFilter: FilterState = {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to: now.toISOString().split("T")[0], preset: "this-month", center: "all", doctor: "all",
  };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: items } = await supabase.from("inventory_items").select("id, item_name, category, unit, current_stock");
    const { data: txns } = await supabase.from("inventory_transactions")
      .select("item_id, type, quantity, total_cost")
      .gte("date", filters.from).lte("date", filters.to);
    const summary = (items ?? []).map(item => {
      const itemTxns = (txns ?? []).filter(t => t.item_id === item.id);
      const purchased  = itemTxns.filter(t => t.type === "Purchase").reduce((s, t) => s + Number(t.quantity), 0);
      const consumed   = itemTxns.filter(t => t.type === "Consumption").reduce((s, t) => s + Number(t.quantity), 0);
      const cost       = itemTxns.filter(t => t.type === "Purchase").reduce((s, t) => s + Number(t.total_cost ?? 0), 0);
      return { ...item, purchased, consumed, cost };
    }).filter(i => i.purchased > 0 || i.consumed > 0);
    setData(summary);
    setLoading(false); setLoaded(true);
  }, [filters]);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} items` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Item Name</Th><Th>Category</Th><Th>Unit</Th>
            <Th>Purchased</Th><Th>Consumed</Th><Th>Current Stock</Th><Th>Purchase Cost</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((item, i) => (
              <tr key={item.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-medium">{item.item_name}</span></Td>
                <Td>{item.category || "—"}</Td>
                <Td>{item.unit || "—"}</Td>
                <Td><span className="text-green-700 font-medium">{item.purchased}</span></Td>
                <Td><span className="text-amber-600 font-medium">{item.consumed}</span></Td>
                <Td><span className={`font-semibold ${Number(item.current_stock) <= 0 ? "text-red-600" : "text-gray-700"}`}>{item.current_stock}</span></Td>
                <Td>{fmt(item.cost)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Prospect List ────────────────────────────────────────────────────────────

function ProspectListReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("crm_leads")
      .select("*").in("status", ["New", "Contacted", "Interested"]).order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} prospects` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Name</Th><Th>Phone</Th><Th>Email</Th>
            <Th>Source</Th><Th>Treatment Interest</Th><Th>Status</Th><Th sortable>Follow-up</Th>
            <Th>Notes</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={9}><EmptyState /></td></tr>}
            {!loading && data.map((lead, i) => (
              <tr key={lead.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-medium text-blue-600">{lead.name}</span></Td>
                <Td><span className="font-mono">{lead.phone || "—"}</span></Td>
                <Td>{lead.email || "—"}</Td>
                <Td>{lead.source || "—"}</Td>
                <Td>{lead.treatment_interest || "—"}</Td>
                <Td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${lead.status === "New" ? "bg-blue-100 text-blue-700" : lead.status === "Contacted" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>{lead.status}</span>
                </Td>
                <Td>{fmtDate(lead.follow_up_date)}</Td>
                <Td><span className="text-gray-500 italic">{lead.notes || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loaded && data.length > 0 && (
        <SummaryBox items={[
          { label: "Total Prospects", value: data.length },
          { label: "New", value: data.filter(l => l.status === "New").length },
          { label: "Contacted", value: data.filter(l => l.status === "Contacted").length },
          { label: "Interested", value: data.filter(l => l.status === "Interested").length },
        ]} />
      )}
    </div>
  );
}

// ─── Opportunities List ───────────────────────────────────────────────────────

function OpportunitiesReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("crm_leads")
      .select("*").eq("status", "Interested").order("follow_up_date");
    setData(rows ?? []);
    setLoading(false); setLoaded(true);
  }, []);

  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        onView={load} onReset={() => { setFilters(defaultFilter); setLoaded(false); setData([]); }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{loaded ? `${data.length} hot opportunities` : ""}</span>
        <ExportBar />
      </div>
      <div className="mt-2 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse">
          <thead><tr>
            <Th>S.No</Th><Th>Name</Th><Th>Phone</Th><Th>Email</Th>
            <Th>Source</Th><Th>Treatment Interest</Th><Th sortable>Follow-up Date</Th><Th>Notes</Th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><LoadingState /></td></tr>}
            {!loading && (loaded ? data.length === 0 : true) && <tr><td colSpan={8}><EmptyState /></td></tr>}
            {!loading && data.map((lead, i) => (
              <tr key={lead.id} className="hover:bg-blue-50/30">
                <Td>{i + 1}</Td>
                <Td><span className="font-medium text-blue-600">{lead.name}</span></Td>
                <Td><span className="font-mono">{lead.phone || "—"}</span></Td>
                <Td>{lead.email || "—"}</Td>
                <Td>{lead.source || "—"}</Td>
                <Td><span className="font-medium text-purple-700">{lead.treatment_interest || "—"}</span></Td>
                <Td>
                  {lead.follow_up_date ? (
                    <span className={`font-medium ${new Date(lead.follow_up_date) < new Date() ? "text-red-600" : "text-green-600"}`}>{fmtDate(lead.follow_up_date)}</span>
                  ) : "—"}
                </Td>
                <Td><span className="text-gray-500 italic">{lead.notes || "—"}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Missing table stub ───────────────────────────────────────────────────────

function MissingTableReport({ id }: { id: ReportId }) {
  const table = NEEDS_TABLE[id] ?? "unknown";
  const defaultFilter: FilterState = { from: "", to: "", preset: "this-month", center: "all", doctor: "all" };
  const [filters, setFilters] = useState(defaultFilter);
  return (
    <div>
      <FilterBar state={filters} onChange={p => setFilters(f => ({ ...f, ...p }))}
        showType={id === "receipts"} showVoucherStatus={id === "receipts"}
        showGroupByDate={id === "receipts"}
        onView={() => {}} onReset={() => setFilters(defaultFilter)} />
      <MissingTableBanner table={table} />
      <div className="mt-2 border border-gray-200 rounded-lg bg-white"><EmptyState /></div>
    </div>
  );
}

// ─── Report router ────────────────────────────────────────────────────────────

function ReportContent({ id }: { id: ReportId }) {
  const needsTable = NEEDS_TABLE[id];
  return (
    <div>
      <div className="mb-4"><h2 className="text-base font-semibold text-[#1e2d5a]">{REPORT_TITLES[id]}</h2></div>
      {needsTable                                   ? <MissingTableReport id={id} />           : null}
      {!needsTable && (() => {
        switch (id) {
          case "patient-summary":  return <PatientSummaryReport />;
          case "referral-summary": return <ReferralSummaryReport />;
          case "patient-list":     return <PatientListReport />;
          case "patient-contact":  return <PatientContactReport />;
          case "patients-period":  return <PatientsPeriodReport />;
          case "birthday-list":     return <BirthdayListReport />;
          case "anniversary-list": return <AnniversaryListReport />;
          case "never-visited":    return <NeverVisitedReport />;
          case "appt-scheduled":   return <AppointmentsTable dateField="appointment_date" />;
          case "appt-booked":      return <AppointmentsTable dateField="created_at" />;
          case "daily-activity":   return <DailyActivityReport />;
          case "dart":             return <DartReport />;
          case "dr-occupancy":     return <DrOccupancyReport />;
          case "practice-summary": return <PracticeSummaryReport />;
          case "treatments-done":      return <TreatmentReport mode="done" />;
          case "open-treatments":      return <TreatmentReport mode="open" />;
          case "treatment-plans":      return <TreatmentReport mode="plans" />;
          case "patients-treatment":   return <TreatmentReport mode="by-treatment" />;
          case "conversion":           return <ConversionReport />;
          case "receipts":             return <ReceiptsReport />;
          case "sales":                return <SalesReport />;
          case "receivables":          return <ReceivablesReport />;
          case "payables":             return <PayablesReport />;
          case "settlements":          return <SettlementsReport />;
          case "day-book":             return <DayBookReport />;
          case "ledger":               return <LedgerReport />;
          case "insurance":            return <InsuranceReport />;
          case "voucher-list":         return <VoucherListReport />;
          case "expenses":             return <ExpensesReport />;
          case "membership-expiry":    return <MembershipExpiryReport />;
          case "membership-treatment": return <MembershipTreatmentReport />;
          case "prescription-list":    return <PrescriptionListReport />;
          case "inv-purchase":         return <InventoryPurchaseReport />;
          case "inv-consumption":      return <InventoryConsumptionReport />;
          case "item-purchase":        return <ItemPurchaseConsumptionReport />;
          case "prospect-list":        return <ProspectListReport />;
          case "opportunities":        return <OpportunitiesReport />;
          default:                     return <div className="border border-gray-200 rounded-lg bg-white"><EmptyState /></div>;
        }
      })()}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Reports() {
  const [activeReport, setActiveReport] = useState<ReportId>("patient-summary");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => setCollapsed(s => ({ ...s, [title]: !s[title] }));

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* Secondary sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-1 mb-3">Reports</p>
          {SIDEBAR.map(section => {
            const isOpen = !collapsed[section.title];
            return (
              <div key={section.title} className="mb-1">
                <button onClick={() => toggle(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50">
                  <span className="text-[11px] font-bold text-[#1e2d5a] uppercase tracking-wide">{section.title}</span>
                  {isOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="ml-1 mt-0.5">
                    {section.items.map(item => (
                      <button key={item.id} onClick={() => setActiveReport(item.id)}
                        className={`w-full text-left px-3 py-1.5 rounded text-[11px] transition-colors leading-tight flex items-center gap-1 ${
                          activeReport === item.id
                            ? "text-orange-500 font-semibold bg-orange-50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}>
                        <span className="flex-1">{item.label}</span>
                        {NEEDS_TABLE[item.id] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Requires DB table" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-4 px-2 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Requires database setup
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <ReportContent key={activeReport} id={activeReport} />
      </div>

      {/* Floating help */}
      <button className="fixed bottom-6 right-6 h-11 w-11 rounded-full bg-[#1e2d5a] text-white shadow-lg flex items-center justify-center hover:bg-[#1a2650] z-50">
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
