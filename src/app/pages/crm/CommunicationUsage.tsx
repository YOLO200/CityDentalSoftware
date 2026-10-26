import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { CRMEmptyState, CRMStatusBadge, fmtDate } from "./primitives";

/**
 * Communications reports, read from public.crm_campaigns
 * (id, name, channel, status, audience, sent_count, delivered_count,
 * failed_count, scheduled_at, created_at).
 *
 * The app has no SMS / WhatsApp / email provider connected, so nothing is
 * actually sent and these counts are only what has been recorded on the
 * campaign rows. The banner says so rather than letting zeros look like real
 * delivery data.
 */

interface Campaign {
  id: string;
  name: string | null;
  channel: string | null;
  status: string | null;
  audience: string | null;
  sent_count: number | null;
  delivered_count: number | null;
  failed_count: number | null;
  scheduled_at: string | null;
  created_at: string;
}

/** Local-time YYYY-MM-DD, `days` back from today. */
function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function useCampaigns(channels: string[], from: string, to: string) {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = channels.join(",");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("crm_campaigns")
      .select("id, name, channel, status, audience, sent_count, delivered_count, failed_count, scheduled_at, created_at")
      .in("channel", channels)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (from) q = q.gte("created_at", `${from}T00:00:00`);
    if (to) q = q.lte("created_at", `${to}T23:59:59`);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows((data ?? []) as Campaign[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, from, to]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, error };
}

const n = (v: number | null) => v ?? 0;

function NotConnectedNote() {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
      No SMS, WhatsApp or email provider is connected yet, so messages are not actually sent. Counts show only what is recorded on campaigns.
    </div>
  );
}

function DateRange({ from, to, onApply }: { from: string; to: string; onApply: (f: string, t: string) => void }) {
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const input = "mt-0.5 block rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#1e2d5a]";
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="text-[11px] text-gray-500">From<input type="date" value={f} onChange={(e) => setF(e.target.value)} className={input} /></label>
      <label className="text-[11px] text-gray-500">To<input type="date" value={t} onChange={(e) => setT(e.target.value)} className={input} /></label>
      <button onClick={() => onApply(f, t)} className="rounded bg-[#1e2d5a] px-6 py-2 text-sm text-white hover:bg-[#162048]">View</button>
      <button
        onClick={() => { const df = dayOffset(30), dt = dayOffset(0); setF(df); setT(dt); onApply(df, dt); }}
        className="rounded bg-gray-400 px-6 py-2 text-sm text-white hover:bg-gray-500"
      >
        Reset
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
    </div>
  );
}

// ─── Detailed (one row per campaign) ─────────────────────────────────────────

function UsageDetailed({ title, channels }: { title: string; channels: string[] }) {
  const [range, setRange] = useState({ from: dayOffset(30), to: dayOffset(0) });
  const { rows, loading, error } = useCampaigns(channels, range.from, range.to);
  const total = (k: "sent_count" | "delivered_count" | "failed_count") => rows.reduce((s, r) => s + n(r[k]), 0);

  return (
    <div>
      <h2 className="mb-3 text-xl text-[#1e2d5a]">{title}</h2>
      <NotConnectedNote />
      <DateRange from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading ? <Spinner /> : rows.length === 0 ? <CRMEmptyState /> : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                {["Date", "Campaign", "Channel", "Audience", "Sent", "Delivered", "Failed", "Status"].map((h) => (
                  <th key={h} className={`px-3 py-2 font-medium ${["Sent", "Delivered", "Failed"].includes(h) ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{fmtDate(r.scheduled_at ?? r.created_at)}</td>
                  <td className="px-3 py-2 text-gray-800">{r.name ?? "—"}</td>
                  <td className="px-3 py-2">{r.channel}</td>
                  <td className="px-3 py-2">{r.audience ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{n(r.sent_count)}</td>
                  <td className="px-3 py-2 text-right">{n(r.delivered_count)}</td>
                  <td className="px-3 py-2 text-right">{n(r.failed_count)}</td>
                  <td className="px-3 py-2">{r.status ? <CRMStatusBadge status={r.status} /> : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={4}>Total ({rows.length} campaign{rows.length === 1 ? "" : "s"})</td>
                <td className="px-3 py-2 text-right">{total("sent_count")}</td>
                <td className="px-3 py-2 text-right">{total("delivered_count")}</td>
                <td className="px-3 py-2 text-right">{total("failed_count")}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Summary (month × channel) ───────────────────────────────────────────────

function UsageSummary({ title, channels }: { title: string; channels: string[] }) {
  const [range, setRange] = useState({ from: dayOffset(180), to: dayOffset(0) });
  const { rows, loading, error } = useCampaigns(channels, range.from, range.to);

  const groups = new Map<string, { month: string; channel: string; campaigns: number; sent: number; delivered: number; failed: number }>();
  for (const r of rows) {
    const d = new Date(r.scheduled_at ?? r.created_at);
    const month = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const key = `${sortKey}|${r.channel}`;
    const g = groups.get(key) ?? { month, channel: r.channel ?? "—", campaigns: 0, sent: 0, delivered: 0, failed: 0 };
    g.campaigns += 1;
    g.sent += n(r.sent_count);
    g.delivered += n(r.delivered_count);
    g.failed += n(r.failed_count);
    groups.set(key, g);
  }
  const summary = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([, g]) => g);

  return (
    <div>
      <h2 className="mb-3 text-xl text-[#1e2d5a]">{title}</h2>
      <NotConnectedNote />
      <DateRange from={range.from} to={range.to} onApply={(from, to) => setRange({ from, to })} />
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading ? <Spinner /> : summary.length === 0 ? <CRMEmptyState /> : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Month</th>
                <th className="px-3 py-2 font-medium">Channel</th>
                <th className="px-3 py-2 text-right font-medium">Campaigns</th>
                <th className="px-3 py-2 text-right font-medium">Sent</th>
                <th className="px-3 py-2 text-right font-medium">Delivered</th>
                <th className="px-3 py-2 text-right font-medium">Failed</th>
                <th className="px-3 py-2 text-right font-medium">Delivery rate</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((g, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2">{g.month}</td>
                  <td className="px-3 py-2">{g.channel}</td>
                  <td className="px-3 py-2 text-right">{g.campaigns}</td>
                  <td className="px-3 py-2 text-right">{g.sent}</td>
                  <td className="px-3 py-2 text-right">{g.delivered}</td>
                  <td className="px-3 py-2 text-right">{g.failed}</td>
                  <td className="px-3 py-2 text-right">{g.sent ? `${Math.round((g.delivered / g.sent) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Channel values as the old campaign screens wrote them ("SMS", "WhatsApp",
// "Email"); WABA = WhatsApp Business API campaigns.
export const Emails = () => <UsageDetailed title="Emails" channels={["Email"]} />;
export const SmsWaUsageDetailed = () => <UsageDetailed title="SMS/WA Usage Detailed" channels={["SMS", "WhatsApp"]} />;
export const WabaUsageDetailed = () => <UsageDetailed title="WABA Usage Detailed" channels={["WABA"]} />;
export const SmsWaUsageSummary = () => <UsageSummary title="SMS/WA Usage Summary" channels={["SMS", "WhatsApp", "WABA"]} />;
