import { useEffect, useState } from "react";
import { Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { KPICard } from "../components/KPICard";
import { supabase } from "../../lib/supabase";
import { useBranch } from "../context/BranchContext";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

interface MonthPoint {
  month: string;
  gross: number;
  expenses: number;
  netAmount: number;
}

interface Appt {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  status: string;
}

interface Alert {
  id: string;
  message: string;
  priority: "high" | "medium" | "low";
}

/** Shape of the jsonb returned by public.dashboard_stats(uuid). */
interface Stats {
  patients: number;
  patientsThisMonth: number;
  apptsToday: number;
  apptsYesterday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  pendingPayments: number;
  overduePatients: number;
  lowStock: number;
  chart: MonthPoint[];
  appointments: Appt[];
}

const EMPTY: Stats = {
  patients: 0, patientsThisMonth: 0, apptsToday: 0, apptsYesterday: 0,
  revenueThisMonth: 0, revenueLastMonth: 0, pendingPayments: 0,
  overduePatients: 0, lowStock: 0, chart: [], appointments: [],
};

function pct(current: number, previous: number): { change: string; trend: "up" | "down" } {
  if (previous === 0) {
    return { change: current > 0 ? "no prior month to compare" : "no activity yet", trend: "up" };
  }
  const delta = ((current - previous) / previous) * 100;
  return {
    change: `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% from last month`,
    trend: delta >= 0 ? "up" : "down",
  };
}

function buildAlerts(s: Stats): Alert[] {
  const alerts: Alert[] = [];
  if (s.overduePatients > 0) {
    alerts.push({
      id: "overdue",
      message: `${s.overduePatients} patient${s.overduePatients === 1 ? "" : "s"} with an outstanding balance (${inr(s.pendingPayments)})`,
      priority: "high",
    });
  }
  if (s.lowStock > 0) {
    alerts.push({
      id: "stock",
      message: `${s.lowStock} inventory item${s.lowStock === 1 ? "" : "s"} at or below reorder level`,
      priority: "medium",
    });
  }
  const unconfirmed = s.appointments.filter(a => a.status === "Pending").length;
  if (unconfirmed > 0) {
    alerts.push({
      id: "unconfirmed",
      message: `${unconfirmed} appointment${unconfirmed === 1 ? "" : "s"} today still need confirmation`,
      priority: "low",
    });
  }
  return alerts;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { selectedBranch, isLoading: branchLoading } = useBranch();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBranch) return;
    let cancelled = false;
    setRefreshing(true);
    setError(null);

    // One round trip. All aggregation, month bucketing and name joining happens
    // in Postgres — see supabase/migrations/010_dashboard_stats_rpc.sql.
    supabase
      .rpc("dashboard_stats", { p_branch_id: selectedBranch.id })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          // Surface the real Postgres message — a failure here is almost always
          // a missing migration or a missing dashboard:view grant, and both are
          // invisible if this is swallowed.
          console.error("dashboard_stats failed:", err);
          setError(err.message);
          // Must still populate stats, or the !stats guard below returns a
          // spinner forever and the error banner never gets a chance to render.
          setStats(EMPTY);
        } else {
          setStats({ ...EMPTY, ...(data as unknown as Stats) });
        }
        setRefreshing(false);
      });

    return () => { cancelled = true; };
  }, [selectedBranch]);

  if (branchLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="p-8">
        <h1 className="mb-2 text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          No branches found. Add one under Settings → Branches to see data here.
        </p>
      </div>
    );
  }

  // Only the very first load blocks; a branch switch keeps the previous numbers
  // on screen and dims them, which reads as much faster than a full spinner.
  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const revenueDelta = pct(stats.revenueThisMonth, stats.revenueLastMonth);
  const apptDelta = stats.apptsToday - stats.apptsYesterday;
  const alerts = buildAlerts(stats);

  return (
    <div className="p-8">
      <div className={`mx-auto max-w-7xl transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <div className="mb-8">
          <h1 className="text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{selectedBranch.name}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load dashboard data: {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Patients"
            value={stats.patients.toLocaleString("en-IN")}
            change={`+${stats.patientsThisMonth} this month`}
            trend="up"
            icon={Users}
          />
          <KPICard
            title="Appointments Today"
            value={String(stats.apptsToday)}
            change={`${apptDelta >= 0 ? "+" : ""}${apptDelta} from yesterday`}
            trend={apptDelta >= 0 ? "up" : "down"}
            icon={Calendar}
          />
          <KPICard
            title="Revenue This Month"
            value={inr(stats.revenueThisMonth)}
            change={revenueDelta.change}
            trend={revenueDelta.trend}
            icon={DollarSign}
          />
          <KPICard
            title="Pending Payments"
            value={inr(stats.pendingPayments)}
            change={
              stats.overduePatients === 0
                ? "no outstanding balances"
                : `across ${stats.overduePatients} patient${stats.overduePatients === 1 ? "" : "s"}`
            }
            trend={stats.pendingPayments > 0 ? "down" : "up"}
            icon={AlertCircle}
          />
        </div>

        {/* Revenue Chart */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl">Practice Summary</h2>
            <p className="text-sm text-muted-foreground">
              Collections, expenses &amp; net — last {stats.chart.length} months
            </p>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}K`)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                  formatter={(value: number) => inr(value)}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                <Bar yAxisId="left" dataKey="gross" fill="#60a5fa" name="Collections" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="left" dataKey="expenses" fill="#bfdbfe" name="Expenses" radius={[8, 8, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="netAmount"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ fill: "#1e40af", r: 4 }}
                  name="Net"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today's Appointments */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl">Today's Appointments</h2>
            {stats.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments scheduled today.</p>
            ) : (
              <div className="space-y-3">
                {stats.appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.time} · {a.doctor}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl">Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3 text-sm ${
                      alert.priority === "high"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : alert.priority === "medium"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/patients/add")}
              className="rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground hover:bg-primary/90">
              + Add Patient
            </button>
            <button onClick={() => navigate("/calendar?newModal=1")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary">
              Schedule Appointment
            </button>
            <button onClick={() => navigate("/patients")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-secondary">
              View Patients
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
