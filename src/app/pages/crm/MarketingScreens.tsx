import { useState, useCallback, useEffect } from "react";
import { Send, Plus, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useProfiles } from "../admin/primitives";
import {
  CRMPageHeader, CRMTable, CRMStatusBadge, CRMModal, CRMFilterBar, KPICard,
  PrimaryBtn, GhostBtn, CInput, CSelect, CDate, CTextarea, StarRating, fmtDate,
} from "./primitives";

const CHART_COLORS = ["#1e2d5a","#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#64748b","#f97316"];

// ─── Referral Sources ─────────────────────────────────────────────────────────

export function ReferralSources() {
  const [data,    setData]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("crm_leads").select("source, status").then(({ data: leads }) => {
      if (!leads) { setLoading(false); return; }
      const map: Record<string, { leads: number; converted: number; revenue: number }> = {};
      leads.forEach(l => {
        const src = l.source ?? "Unknown";
        if (!map[src]) map[src] = { leads: 0, converted: 0, revenue: 0 };
        map[src].leads++;
        if (l.status === "Converted") map[src].converted++;
      });
      setData(Object.entries(map).map(([source, v]) => ({ source, ...v })));
      setLoading(false);
    });
  }, []);

  const totalLeads    = data.reduce((s,r) => s + r.leads, 0);
  const totalConverted = data.reduce((s,r) => s + r.converted, 0);
  const pieData   = data.map(r => ({ name: r.source, value: r.leads }));
  const barData   = data.map(r => ({ source: r.source.slice(0,8), converted: r.converted }));

  return (
    <div className="space-y-5">
      <CRMPageHeader title="Referral Sources" />
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="Total Leads"     value={totalLeads} />
        <KPICard label="Total Converted" value={totalConverted} color="text-green-600" />
        <KPICard label="Conversion Rate" value={totalLeads > 0 ? `${Math.round(totalConverted/totalLeads*100)}%` : "—"} color="text-[#1e2d5a]" />
      </div>

      {loading ? <div className="h-48 animate-pulse bg-gray-100 rounded-xl" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Leads by Source</p>
            {pieData.length === 0
              ? <div className="flex items-center justify-center h-40 text-gray-300">No data yet</div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name.slice(0,8)} ${(percent*100).toFixed(0)}%`} fontSize={9}>
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Conversions by Source</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="source" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="converted" fill="#1e2d5a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <CRMTable loading={loading}
        columns={["Source","Lead Count","Converted","Conversion Rate"]}
        rows={data.map(r => [
          <span className="font-medium">{r.source}</span>,
          r.leads,
          <span className="text-green-600 font-medium">{r.converted}</span>,
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#1e2d5a] rounded-full" style={{ width: `${r.leads > 0 ? Math.round(r.converted/r.leads*100) : 0}%` }} />
            </div>
            <span className="font-semibold">{r.leads > 0 ? Math.round(r.converted/r.leads*100) : 0}%</span>
          </div>,
        ])}
      />
    </div>
  );
}

// ─── Campaign Tracking ────────────────────────────────────────────────────────

export function CampaignTracking() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    supabase.from("crm_campaigns").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []);
      setLoading(false);
    });
  }, []);

  const active = campaigns.filter(c => c.status === "Active" || c.status === "Sent").length;
  const totalConverted = campaigns.reduce((s,c) => s + (c.converted_count||0), 0);

  return (
    <div>
      <CRMPageHeader title="Campaign Tracking" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard label="Total Campaigns" value={campaigns.length} />
        <KPICard label="Active / Sent"   value={active}          color="text-green-600" />
        <KPICard label="Total Converted" value={totalConverted}  color="text-[#1e2d5a]" />
      </div>
      <CRMTable loading={loading}
        columns={["Campaign","Channel","Sent","Opened","Clicked","Converted","ROI","Status"]}
        rows={campaigns.map(c => [
          <span className="font-medium">{c.name}</span>,
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.channel==="WhatsApp"?"bg-green-100 text-green-700":c.channel==="SMS"?"bg-blue-100 text-blue-700":c.channel==="Email"?"bg-purple-100 text-purple-700":"bg-red-100 text-red-700"}`}>{c.channel ?? "—"}</span>,
          c.sent_count ?? 0,
          c.opened_count ?? 0,
          c.clicked_count ?? 0,
          <span className="text-green-600 font-semibold">{c.converted_count ?? 0}</span>,
          <span className="text-[#1e2d5a] font-bold">{c.roi ?? "—"}</span>,
          <CRMStatusBadge status={c.status} />,
        ])}
      />
    </div>
  );
}

// ─── Patient Retention ────────────────────────────────────────────────────────

export function PatientRetention() {
  const [buckets,  setBuckets]  = useState<{ range: string; count: number; color: string }[]>([]);
  const [loading,  setLoading]  = useState(false);

  const BUCKET_DEFS = [
    { range: "< 1 month",   months: 1,  color: "bg-green-500"  },
    { range: "1–3 months",  months: 3,  color: "bg-blue-500"   },
    { range: "3–6 months",  months: 6,  color: "bg-amber-500"  },
    { range: "6–12 months", months: 12, color: "bg-orange-500" },
    { range: "> 12 months", months: 999,color: "bg-red-500"    },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("appointments")
      .select("patient_id, appointment_date")
      .order("appointment_date", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Latest appointment per patient
    const lastVisit: Record<string, string> = {};
    data.forEach((a: any) => {
      if (!lastVisit[a.patient_id]) lastVisit[a.patient_id] = a.appointment_date;
    });

    const now = new Date();
    const counts = [0, 0, 0, 0, 0];
    Object.values(lastVisit).forEach(dateStr => {
      const diffMs    = now.getTime() - new Date(dateStr).getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if      (diffMonths < 1)  counts[0]++;
      else if (diffMonths < 3)  counts[1]++;
      else if (diffMonths < 6)  counts[2]++;
      else if (diffMonths < 12) counts[3]++;
      else                      counts[4]++;
    });

    setBuckets(BUCKET_DEFS.map((b, i) => ({ range: b.range, count: counts[i], color: b.color })));
    setLoading(false);
  }, []);

  const total = buckets.reduce((s,b) => s + b.count, 0);

  return (
    <div>
      <CRMPageHeader title="Patient Retention" />
      <div className="mb-3"><PrimaryBtn onClick={load}>{loading ? "Loading..." : "Load Retention Data"}</PrimaryBtn></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 mb-4">Last Visit Distribution</p>
          {buckets.length === 0
            ? <p className="text-xs text-gray-400 text-center py-8">Click "Load Retention Data" to view</p>
            : (
              <div className="space-y-3">
                {buckets.map(b => (
                  <div key={b.range} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 flex-shrink-0">{b.range}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: total > 0 ? `${Math.round(b.count/total*100)}%` : "0%" }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{b.count}</span>
                    <span className="text-[10px] text-gray-400 w-8">{total > 0 ? Math.round(b.count/total*100) : 0}%</span>
                  </div>
                ))}
              </div>
            )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 mb-4">Re-engagement Actions</p>
          <div className="space-y-3">
            {[
              { label: "Patients inactive 3+ months",  count: buckets[2]?.count + buckets[3]?.count + buckets[4]?.count || 0, action: "Send recall SMS" },
              { label: "Patients inactive 6+ months",  count: buckets[3]?.count + buckets[4]?.count || 0, action: "Personal call + offer" },
              { label: "Patients inactive 12+ months", count: buckets[4]?.count || 0, action: "Reactivation campaign" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs font-medium text-gray-700">{item.label}</div>
                  <div className="text-[10px] text-gray-400">{item.action}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500">{item.count}</span>
                  <PrimaryBtn className="text-[10px] px-2 py-1">Act</PrimaryBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback & Reviews ───────────────────────────────────────────────────────

export function FeedbackReviews() {
  const { user }  = useAuth();
  const profiles  = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fPatient, setFPatient] = useState("");
  const [fDoctor,  setFDoctor]  = useState("");
  const [fRating,  setFRating]  = useState("5");
  const [fComment, setFComment] = useState("");
  const [fDate,    setFDate]    = useState(new Date().toISOString().split("T")[0]);

  const doctorOptions = ["Select Doctor", ...profiles.map(p => p.name)];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_feedback").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgRating = rows.length > 0 ? (rows.reduce((s,f) => s + (f.rating||0), 0) / rows.length).toFixed(1) : "—";

  const byDoctor = profiles.slice(0, 4).map(p => {
    const doctorRows = rows.filter(r => r.doctor_name === p.name);
    const avg = doctorRows.length > 0 ? (doctorRows.reduce((s,r) => s + (r.rating||0), 0) / doctorRows.length).toFixed(1) : "—";
    return { doctor: p.name, avg };
  });

  const save = async () => {
    if (!fPatient) { setError("Patient name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_feedback").insert({
      created_by: user?.id ?? null,
      patient_name: fPatient,
      doctor_name: fDoctor !== "Select Doctor" ? fDoctor : null,
      rating: Number(fRating),
      comment: fComment || null,
      review_date: fDate,
      status: "Pending",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setFPatient(""); setFDoctor(""); setFRating("5"); setFComment(""); setError(null);
    load();
  };

  const publish = async (id: string) => {
    await supabase.from("crm_feedback").update({ status: "Published" }).eq("id", id);
    load();
  };

  return (
    <div>
      <CRMPageHeader title="Feedback & Reviews" rightSlot={
        <>
          <PrimaryBtn onClick={() => setModal(true)}><Plus className="h-3.5 w-3.5 inline mr-1" />Add Review</PrimaryBtn>
          <GhostBtn><Send className="h-3.5 w-3.5 inline mr-1" />Send Request</GhostBtn>
        </>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPICard label="Average Rating"  value={rows.length > 0 ? `${avgRating} ★` : "—"} color="text-amber-500" />
        <KPICard label="Total Reviews"   value={rows.length} />
        <KPICard label="5-Star Reviews"  value={rows.filter(r=>r.rating===5).length} color="text-green-600" />
        <KPICard label="Pending"         value={rows.filter(r=>r.status==="Pending").length} color="text-amber-600" />
      </div>

      {byDoctor.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {byDoctor.map(d => (
            <div key={d.doctor} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs font-medium text-gray-700 mb-1">{d.doctor.replace("Dr. ","")}</div>
              <div className="text-2xl font-bold text-amber-500">{d.avg}</div>
              <div className="text-[10px] text-gray-400">avg rating</div>
            </div>
          ))}
        </div>
      )}

      <CRMTable loading={loading}
        columns={["Patient","Doctor","Rating","Comment","Date","Status","Actions"]}
        rows={rows.map(f => [
          <span className="font-medium">{f.patient_name ?? "—"}</span>,
          f.doctor_name ?? "—",
          <StarRating rating={f.rating ?? 0} />,
          <span className="max-w-[200px] truncate block text-gray-500 italic text-[11px]">{f.comment ?? "—"}</span>,
          fmtDate(f.review_date),
          <CRMStatusBadge status={f.status ?? "Pending"} />,
          <div className="flex gap-1">
            {f.status !== "Published" && (
              <button onClick={() => publish(f.id)} className="text-[10px] border border-green-300 text-green-700 rounded px-1.5 py-0.5 hover:bg-green-50">Publish</button>
            )}
            <button className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50">Reply</button>
          </div>,
        ])}
      />

      <CRMModal title="Add Review" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Patient Name" value={fPatient} onChange={setFPatient} required className="col-span-2" />
            <CSelect label="Doctor"       options={doctorOptions} value={fDoctor}  onChange={setFDoctor} />
            <CSelect label="Rating"       options={["5","4","3","2","1"]}  value={fRating}  onChange={setFRating} />
            <CDate   label="Review Date"  value={fDate}    onChange={setFDate} />
            <CTextarea label="Comment"    value={fComment} onChange={setFComment}  className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={save}>{saving ? "Saving..." : "Save Review"}</PrimaryBtn>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Membership Campaigns ─────────────────────────────────────────────────────

export function MembershipCampaigns() {
  const { user }  = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fAudience, setFAudience] = useState("Gold Members");
  const [fStart,    setFStart]    = useState(new Date().toISOString().split("T")[0]);
  const [fEnd,      setFEnd]      = useState("");
  const [fNotes,    setFNotes]    = useState("");

  const MEMBERSHIP_AUDIENCES = ["Gold Members","Silver Members","New Patients","All Members","Expiring Members"];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_campaigns")
      .select("*")
      .eq("campaign_type", "Membership")
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Campaign name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_campaigns").insert({
      created_by: user?.id ?? null,
      name: fName, campaign_type: "Membership",
      audience: fAudience, channel: "WhatsApp",
      start_date: fStart || null, end_date: fEnd || null,
      notes: fNotes || null, status: "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setFName(""); setFEnd(""); setFNotes(""); setError(null);
    load();
  };

  return (
    <div>
      <CRMPageHeader title="Membership Campaigns" rightSlot={
        <PrimaryBtn onClick={() => setModal(true)}><Plus className="h-3.5 w-3.5 inline mr-1" />New Campaign</PrimaryBtn>
      } />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPICard label="Active Campaigns" value={campaigns.filter(c=>c.status==="Active").length} color="text-green-600" />
        <KPICard label="Total Campaigns"  value={campaigns.length} />
        <KPICard label="Total Converted"  value={campaigns.reduce((s,c)=>s+(c.converted_count||0),0)} color="text-[#1e2d5a]" />
      </div>
      <CRMTable loading={loading}
        columns={["Campaign Name","Audience","Start Date","End Date","Status","Actions"]}
        rows={campaigns.map(c => [
          <span className="font-medium">{c.name}</span>,
          <span className="text-[10px] bg-purple-100 text-purple-700 rounded px-1.5 py-0.5 font-medium">{c.audience ?? "—"}</span>,
          fmtDate(c.start_date), fmtDate(c.end_date),
          <CRMStatusBadge status={c.status} />,
          <button className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50">Edit</button>,
        ])}
      />

      <CRMModal title="New Membership Campaign" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Campaign Name" value={fName}     onChange={setFName}     required className="col-span-2" />
            <CSelect label="Audience"      options={MEMBERSHIP_AUDIENCES} value={fAudience} onChange={setFAudience} className="col-span-2" />
            <CDate   label="Start Date"    value={fStart}    onChange={setFStart} />
            <CDate   label="End Date"      value={fEnd}      onChange={setFEnd} />
            <CTextarea label="Notes"       value={fNotes}    onChange={setFNotes}    className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={save}>{saving ? "Saving..." : "Create Campaign"}</PrimaryBtn>
            <GhostBtn onClick={() => setModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}
