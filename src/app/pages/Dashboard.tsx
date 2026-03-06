import { Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { KPICard } from "../components/KPICard";
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

const appointments = [
  {
    id: 1,
    time: "09:00 AM",
    patient: "Emma Thompson",
    doctor: "Dr. Anand Jasani",
    status: "Confirmed",
  },
  {
    id: 2,
    time: "10:00 AM",
    patient: "Michael Chen",
    doctor: "Dr. Michael Foster",
    status: "Confirmed",
  },
  {
    id: 3,
    time: "11:00 AM",
    patient: "Sarah Davis",
    doctor: "Dr. Anand Jasani",
    status: "Waiting",
  },
  {
    id: 4,
    time: "02:00 PM",
    patient: "James Wilson",
    doctor: "Dr. Emily Martinez",
    status: "Confirmed",
  },
  {
    id: 5,
    time: "03:30 PM",
    patient: "Lisa Anderson",
    doctor: "Dr. Robert Williams",
    status: "Confirmed",
  },
];

const alerts = [
  {
    id: 1,
    type: "payment",
    message: "5 overdue payments require attention",
    priority: "high",
  },
  {
    id: 2,
    type: "lab",
    message: "3 pending lab results ready for review",
    priority: "medium",
  },
  {
    id: 3,
    type: "appointment",
    message: "2 appointment confirmations needed",
    priority: "low",
  },
];

const revenueData = [
  {
    month: "2025 Sep",
    gross: 12700,
    discount: 1500,
    labExpenses: 900,
    netAmount: 18500,
  },
  {
    month: "2025 Oct",
    gross: 14200,
    discount: 1800,
    labExpenses: 800,
    netAmount: 19200,
  },
  {
    month: "2025 Nov",
    gross: 15900,
    discount: 2100,
    labExpenses: 900,
    netAmount: 21500,
  },
  {
    month: "2025 Dec",
    gross: 13100,
    discount: 1700,
    labExpenses: 750,
    netAmount: 20100,
  },
  {
    month: "2026 Jan",
    gross: 16200,
    discount: 2300,
    labExpenses: 1100,
    netAmount: 22800,
  },
  {
    month: "2026 Feb",
    gross: 13300,
    discount: 1900,
    labExpenses: 850,
    netAmount: 19800,
  },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl">Dashboard</h1>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Patients"
            value="1,284"
            change="+12% from last month"
            trend="up"
            icon={Users}
          />
          <KPICard
            title="Appointments Today"
            value="24"
            change="+3 from yesterday"
            trend="up"
            icon={Calendar}
          />
          <KPICard
            title="Revenue This Month"
            value="₹4,85,620"
            change="+18% from last month"
            trend="up"
            icon={DollarSign}
          />
          <KPICard
            title="Pending Payments"
            value="₹1,23,400"
            change="-5% from last week"
            trend="down"
            icon={AlertCircle}
          />
        </div>

        {/* Revenue Chart */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl">Practice Summary</h2>
            <p className="text-sm text-muted-foreground">
              Gross, Discount, Lab Expenses & Net Amount
            </p>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
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
                  tickFormatter={(value) => `${value / 1000}M`}
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
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar
                  key="gross-bar"
                  yAxisId="left"
                  dataKey="gross"
                  stackId="a"
                  fill="#60a5fa"
                  name="Gross"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  key="discount-bar"
                  yAxisId="left"
                  dataKey="discount"
                  stackId="a"
                  fill="#93c5fd"
                  name="Discount"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  key="lab-expenses-bar"
                  yAxisId="left"
                  dataKey="labExpenses"
                  stackId="a"
                  fill="#bfdbfe"
                  name="Lab Expenses"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  key="net-amount-line"
                  yAxisId="right"
                  type="monotone"
                  dataKey="netAmount"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ fill: "#1e40af", r: 4 }}
                  name="Net Amount"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full rounded-xl bg-primary px-4 py-3 text-left text-sm text-primary-foreground hover:bg-primary/90">
                + Add Patient
              </button>
              <button className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-secondary">
                Schedule Appointment
              </button>
              <button className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-secondary">
                Create Invoice
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl">Alerts</h2>
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
          </div>
        </div>
      </div>
    </div>
  );
}