import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

/** One month of public.practice_summary() output. `lab` is null when a filter is set. */
interface SummaryMonth {
  month: string;
  net: number;
  discount: number;
  lab: number | null;
  compensation: number;
  treatments: number;
}

interface Option {
  value: string;
  label: string;
}

interface Summary {
  months: SummaryMonth[];
  options: { doctor: Option[]; treatment: Option[] };
}

type Dimension = "doctor" | "treatment" | "category" | "rate_card" | "group" | "package";

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "doctor", label: "Doctor" },
  { value: "treatment", label: "Treatment" },
  { value: "category", label: "Category" },
  { value: "rate_card", label: "Rate Card" },
  { value: "group", label: "Group" },
  { value: "package", label: "Package" },
];

const ALL = "all";

// Same blue palette the Dashboard chart used before (Collections #60a5fa,
// Expenses #bfdbfe, Net line #1e40af), extended to four stacked shades.
const COLORS = {
  net: "#60a5fa",
  discount: "#93c5fd",
  lab: "#bfdbfe",
  compensation: "#dbeafe",
  treatments: "#1e40af",
};

/** 4090000 → "4.09M", 632000 → "632K". */
function compact(v: number): string {
  if (v >= 999_500) return `${Number((v / 1_000_000).toPrecision(3))}M`;
  if (v >= 1_000) return `${Number((v / 1_000).toPrecision(3))}K`;
  return String(Math.round(v));
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Bar labels only where there is room — a 0 or tiny segment stays unlabelled. */
const barLabel = (v: unknown) => (typeof v === "number" && v > 0 ? compact(v) : "");

export function PracticeSummary({ branchId }: { branchId: string }) {
  const [dimension, setDimension] = useState<Dimension>("doctor");
  const [value, setValue] = useState<string>(ALL);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A value belongs to one dimension and one branch; carrying it across either
  // change would filter on an id that no longer means anything. The dimension
  // case resets in its change handler so it doesn't fetch twice.
  useEffect(() => { setValue(ALL); }, [branchId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .rpc("practice_summary", {
        p_branch_id: branchId,
        p_dimension: dimension,
        p_value: value === ALL ? null : value,
      })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("practice_summary failed:", err);
          setError(
            err.code === "PGRST202"
              ? "The practice_summary function is missing — run supabase/migrations/021_practice_summary.sql."
              : err.message,
          );
        } else {
          setSummary(data as unknown as Summary);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [branchId, dimension, value]);

  const options: Option[] =
    dimension === "doctor" || dimension === "treatment"
      ? summary?.options[dimension] ?? []
      : [];
  const filtered = value !== ALL;
  const months = summary?.months ?? [];

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-xl">Practice Summary</h2>
        <p className="text-sm text-muted-foreground">
          Gross, Discount, Lab Expenses &amp; Remuneration
        </p>
      </div>

      <div className="p-6">
        <div className="mb-4 flex flex-wrap justify-end gap-3">
          <Select value={dimension} onValueChange={(v) => { setDimension(v as Dimension); setValue(ALL); }}>
            <SelectTrigger className="w-40" aria-label="Filter by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIMENSIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="w-64" aria-label="Filter value">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
              {options.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {dimension === "doctor" || dimension === "treatment"
                    ? "Nothing recorded for this branch yet"
                    : "Not set up yet"}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load practice summary: {error}
          </div>
        )}

        <div className={`h-96 transition-opacity ${loading && summary ? "opacity-60" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 13 }} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis
                yAxisId="amount"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={compact}
                label={{ value: "Amount", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 14 }}
              />
              <YAxis
                yAxisId="treatments"
                orientation="right"
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
                label={{ value: "Treatments", angle: 90, position: "insideRight", fill: "#64748b", fontSize: 14 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px",
                }}
                formatter={(v, name) =>
                  name === "No. of Treatments" ? v : typeof v === "number" ? inr(v) : "not split"
                }
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 16 }} iconType="circle" />

              <Bar yAxisId="amount" dataKey="net" stackId="amt" fill={COLORS.net} name="Net Amount">
                <LabelList dataKey="net" position="insideTop" fill="#1e3a8a" fontSize={12} formatter={barLabel} />
              </Bar>
              <Bar yAxisId="amount" dataKey="discount" stackId="amt" fill={COLORS.discount} name="Discount">
                <LabelList dataKey="discount" position="insideTop" fill="#1e3a8a" fontSize={12} formatter={barLabel} />
              </Bar>
              <Bar yAxisId="amount" dataKey="lab" stackId="amt" fill={COLORS.lab} name="Lab Charges" />
              <Bar yAxisId="amount" dataKey="compensation" stackId="amt" fill={COLORS.compensation} name="Compensation" radius={[8, 8, 0, 0]} />

              <Line
                yAxisId="treatments"
                type="monotone"
                dataKey="treatments"
                stroke={COLORS.treatments}
                strokeWidth={2}
                dot={{ fill: COLORS.treatments, r: 4 }}
                name="No. of Treatments"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Net amount is from receipts and treatments are completed appointments. Discount and
          compensation are not recorded yet, so they show as zero.
          {filtered && " Lab charges can’t be split by doctor or treatment, so they are hidden while a filter is set."}
        </p>
      </div>
    </div>
  );
}
