import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Settings } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useBranch } from "../../context/BranchContext";
import { CRMEmptyState, fmtDate } from "./primitives";

/** Tab ids are the p_tab values of public.patient_tracker (migration 024). */
const TABS = [
  { id: "prospect", label: "Prospect", dateLabel: "Registered", help: "Registered but not yet seen — no visit, no completed, missed or cancelled appointment." },
  { id: "no_show", label: "No Show", dateLabel: "Appointment", help: "Appointments marked No-show, and whether the patient has rebooked." },
  { id: "cancelled", label: "Cancelled", dateLabel: "Appointment", help: "Cancelled appointments with the reason, and whether the patient has rebooked." },
  { id: "consulted", label: "Consulted", dateLabel: "Last visit", help: "Seen at least once, but no treatment planned or done yet." },
  { id: "treatment_plans", label: "Treatment Plans", dateLabel: "Planned on", help: "Treatment planned but not started." },
  { id: "in_progress", label: "In Progress", dateLabel: "Planned on", help: "Treatment started, with planned items still pending." },
  { id: "recall", label: "Recall", dateLabel: "Last seen", help: "Not seen for longer than the recall interval, with nothing booked." },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TrackerRow {
  patient_id: string;
  patient_code: string | null;
  name: string;
  phone: string | null;
  event_date: string | null;
  detail: string | null;
  amount: number | null;
}

const RECALL_KEY = "dentosys.tracker.recallMonths";

function readRecall(): number {
  try {
    const n = Number(localStorage.getItem(RECALL_KEY));
    return n >= 1 && n <= 36 ? n : 6;
  } catch {
    return 6;
  }
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function PatientTracker() {
  const navigate = useNavigate();
  const { branches, selectedBranch } = useBranch();
  const [branchId, setBranchId] = useState(selectedBranch?.id ?? "");
  const [tab, setTab] = useState<TabId>("prospect");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // The filters actually applied — inputs only take effect on "View".
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [recallMonths, setRecallMonths] = useState(readRecall);
  const [showSettings, setShowSettings] = useState(false);
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId && selectedBranch) setBranchId(selectedBranch.id);
  }, [branchId, selectedBranch]);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("patient_tracker", {
      p_branch_id: branchId,
      p_tab: tab,
      p_from: applied.from || null,
      p_to: applied.to || null,
      p_recall_months: recallMonths,
    });
    if (err) {
      setError(
        err.code === "PGRST202"
          ? "Patient Tracker isn't set up yet — run supabase/migrations/023_visits.sql and 024_crm_patient_tracker.sql."
          : err.message,
      );
      setRows([]);
    } else {
      setRows((data as TrackerRow[] | null) ?? []);
    }
    setLoading(false);
  }, [branchId, tab, applied, recallMonths]);

  useEffect(() => { load(); }, [load]);

  const current = TABS.find((t) => t.id === tab)!;
  const showAmount = tab === "treatment_plans" || tab === "in_progress";

  const saveRecall = (n: number) => {
    const v = Math.min(Math.max(Math.round(n) || 6, 1), 36);
    setRecallMonths(v);
    try { localStorage.setItem(RECALL_KEY, String(v)); } catch { /* storage unavailable — keep in memory */ }
  };

  return (
    <div className="-m-5 min-h-full bg-white">
      <div className="flex flex-wrap items-end gap-6 px-6 pt-4">
        <h2 className="pb-1.5 text-xl text-[#1e2d5a]">Patient Tracker</h2>
        <label className="flex flex-col text-[11px] text-gray-600">
          Center
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="mt-0.5 min-w-[220px] rounded border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-800 outline-none"
          >
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex-1 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm ${
              tab === t.id ? "border-[#1e2d5a] font-semibold text-[#1e2d5a]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg text-[#1e2d5a]">{current.label}</h3>
            <p className="text-xs text-gray-500">{current.help}</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowSettings((v) => !v)} aria-label="Tracker settings" className="rounded p-1.5 text-gray-600 hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 z-10 mt-1 w-60 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
                <label className="block text-gray-600">
                  Recall after (months without a visit)
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={recallMonths}
                    onChange={(e) => saveRecall(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#1e2d5a]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-[11px] text-gray-500">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 block rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#1e2d5a]" />
          </label>
          <label className="text-[11px] text-gray-500">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5 block rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#1e2d5a]" />
          </label>
          <button onClick={() => setApplied({ from, to })} className="rounded bg-[#1e2d5a] px-6 py-2 text-sm text-white hover:bg-[#162048]">View</button>
          <button
            onClick={() => { setFrom(""); setTo(""); setApplied({ from: "", to: "" }); }}
            className="rounded bg-gray-400 px-6 py-2 text-sm text-white hover:bg-gray-500"
          >
            Reset
          </button>
        </div>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          !error && <CRMEmptyState />
        ) : (
          <div className={`overflow-x-auto rounded-lg border border-gray-200 transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Patient</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">{current.dateLabel}</th>
                  <th className="px-4 py-2 font-medium">Details</th>
                  {showAmount && <th className="px-4 py-2 text-right font-medium">Pending value</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.patient_id}-${i}`}
                    onClick={() => navigate(`/patients/${r.patient_id}`)}
                    className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-[#1e2d5a]">{r.name}</div>
                      {r.patient_code && <div className="text-xs text-gray-400">#{r.patient_code}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">{r.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">{fmtDate(r.event_date)}</td>
                    <td className="px-4 py-2 text-gray-600">{r.detail ?? "—"}</td>
                    {showAmount && <td className="px-4 py-2 text-right text-gray-700">{r.amount ? inr(Number(r.amount)) : "—"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              {rows.length} patient{rows.length === 1 ? "" : "s"}{rows.length >= 500 ? " (showing the first 500 — narrow the dates)" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
