import { useState, useCallback, useEffect } from "react";
import {
  MoreVertical, Plus, FileSpreadsheet, FileText, Phone,
  MessageSquare, UserCheck, UserX, Clock, TrendingUp,
  Users, Target, AlertCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useBranches, useProfiles } from "../admin/primitives";
import {
  KPICard, CRMPageHeader, CRMTable, CRMFilterBar, CRMModal, ActivityTimeline,
  CRMStatusBadge, PriorityBadge, PrimaryBtn, GhostBtn,
  CInput, CSelect, CDate, CTextarea,
  LEAD_STATUSES, PRIORITIES, LEAD_SOURCES, TREATMENTS, BUDGET_RANGES,
  fmtDate,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// ─── Lead Dashboard ───────────────────────────────────────────────────────────

const SOURCE_COLORS = ["#1e2d5a", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#64748b", "#f97316"];

export function LeadDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats,  setStats]  = useState({ total: 0, new: 0, followToday: 0, converted: 0, lost: 0, rate: "0" });
  const [bySource,  setBySource]  = useState<{ name: string; value: number }[]>([]);
  const [monthly,   setMonthly]   = useState<{ month: string; leads: number; converted: number }[]>([]);
  const [recent,    setRecent]    = useState<any[]>([]);
  const [missed,    setMissed]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: leads } = await supabase.from("crm_leads").select("id, status, source, follow_up_date, name, created_at, updated_at");
      if (!leads) { setLoading(false); return; }

      const now = new Date();
      const todayStr = today();
      const total     = leads.length;
      const newLeads  = leads.filter(l => l.status === "New").length;
      const converted = leads.filter(l => l.status === "Converted").length;
      const lost      = leads.filter(l => l.status === "Lost").length;
      const followT   = leads.filter(l => l.follow_up_date === todayStr).length;
      const rate      = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
      setStats({ total, new: newLeads, followToday: followT, converted, lost, rate });

      // By source
      const srcMap: Record<string, number> = {};
      leads.forEach(l => { if (l.source) srcMap[l.source] = (srcMap[l.source] ?? 0) + 1; });
      setBySource(Object.entries(srcMap).map(([name, value]) => ({ name, value })));

      // Monthly trend (last 6 months)
      const months: { month: string; leads: number; converted: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
        const monthLeads = leads.filter(l => {
          const ld = new Date(l.created_at);
          return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
        });
        months.push({ month: key, leads: monthLeads.length, converted: monthLeads.filter(l => l.status === "Converted").length });
      }
      setMonthly(months);

      // Recent leads (last 5)
      const sorted = [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setRecent(sorted);

      // Missed follow-ups
      const overdue = leads.filter(l => l.follow_up_date && l.follow_up_date < todayStr && l.status !== "Converted" && l.status !== "Lost").slice(0, 5);
      setMissed(overdue);

      setLoading(false);
    };
    load();
  }, []);

  const funnelData = [
    { stage: "Total", count: stats.total },
    { stage: "Contacted", count: Math.round(stats.total * 0.7) },
    { stage: "Interested", count: Math.round(stats.total * 0.4) },
    { stage: "Converted", count: stats.converted },
  ];

  return (
    <div className="space-y-5">
      <CRMPageHeader title="Lead Dashboard" rightSlot={
        <div className="flex gap-2">
          <PrimaryBtn onClick={() => onNavigate("add-lead")}><Plus className="h-3.5 w-3.5 inline mr-1" />Add Lead</PrimaryBtn>
          <GhostBtn onClick={() => onNavigate("lead-followups")}>Schedule Follow-up</GhostBtn>
          <GhostBtn onClick={() => onNavigate("sms-campaigns")}>Send Campaign</GhostBtn>
        </div>
      } />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Total Leads"      value={stats.total}      color="text-[#1e2d5a]"    icon={<Users className="h-4 w-4" />} />
        <KPICard label="New Leads"        value={stats.new}        color="text-blue-600"      icon={<Plus className="h-4 w-4" />} />
        <KPICard label="Follow-ups Today" value={stats.followToday} color="text-amber-600"    icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Converted"        value={stats.converted}  color="text-green-600"     icon={<UserCheck className="h-4 w-4" />} />
        <KPICard label="Lost"             value={stats.lost}       color="text-red-500"       icon={<UserX className="h-4 w-4" />} />
        <KPICard label="Conversion Rate"  value={`${stats.rate}%`} color="text-purple-600"    icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads by Source */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Leads by Source</p>
          {bySource.length === 0
            ? <div className="flex items-center justify-center h-32 text-gray-300 text-sm">No data</div>
            : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {bySource.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Conversion Funnel</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={funnelData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 9 }} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e2d5a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Monthly Lead Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Area type="monotone" dataKey="leads" stroke="#1e2d5a" fill="#e0e7ff" strokeWidth={2} />
              <Area type="monotone" dataKey="converted" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Recent Leads</p>
          {recent.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">No leads yet</p> : (
            <div className="space-y-2">
              {recent.map(l => (
                <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs font-medium text-[#1e2d5a]">{l.name}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{l.source ?? "—"}</span>
                  </div>
                  <CRMStatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missed follow-ups */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-xs font-semibold text-red-500">Missed Follow-ups</p>
          </div>
          {missed.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">All follow-ups are on track ✓</p> : (
            <div className="space-y-2">
              {missed.map(l => (
                <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs font-medium text-gray-700">{l.name}</span>
                    <span className="text-[10px] text-red-400 ml-2">Due {fmtDate(l.follow_up_date)}</span>
                  </div>
                  <CRMStatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lead List ────────────────────────────────────────────────────────────────

export function LeadList({ onNavigate }: { onNavigate: (page: string) => void }) {
  const branches = useBranches();
  const profiles = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [fStatus,   setFStatus]   = useState("All");
  const [fSource,   setFSource]   = useState("All");
  const [fPriority, setFPriority] = useState("All");
  const [fSearch,   setFSearch]   = useState("");
  const [fFrom,     setFFrom]     = useState("");
  const [fTo,       setFTo]       = useState("");

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (fStatus !== "All")   q = q.eq("status", fStatus);
    if (fSource !== "All")   q = q.eq("source", fSource);
    if (fPriority !== "All") q = q.eq("priority", fPriority);
    if (fFrom)               q = q.gte("created_at", fFrom);
    if (fTo)                 q = q.lte("created_at", fTo + "T23:59:59");
    const { data } = await q;
    let filtered = (data ?? []).map((r: any) => ({ ...r, assigned_name: profileMap[r.assigned_to] ?? "—" }));
    if (fSearch) filtered = filtered.filter(r => r.name?.toLowerCase().includes(fSearch.toLowerCase()) || r.phone?.includes(fSearch));
    setRows(filtered);
    setLoading(false);
  }, [fStatus, fSource, fPriority, fSearch, fFrom, fTo, profiles]);

  const reset = () => { setFStatus("All"); setFSource("All"); setFPriority("All"); setFSearch(""); setFFrom(""); setFTo(""); setRows([]); };

  return (
    <div>
      <CRMPageHeader title="Lead List" rightSlot={
        <>
          <PrimaryBtn onClick={() => onNavigate("add-lead")}><Plus className="h-3.5 w-3.5 inline mr-1" />Add Lead</PrimaryBtn>
          <GhostBtn><FileSpreadsheet className="h-3.5 w-3.5 inline mr-1" />Excel</GhostBtn>
          <GhostBtn><FileText className="h-3.5 w-3.5 inline mr-1" />PDF</GhostBtn>
        </>
      } />

      <CRMFilterBar onView={load} onReset={reset}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">From</label>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)}
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#1e2d5a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">To</label>
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)}
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#1e2d5a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Status</label>
          <div className="relative">
            <select value={fStatus} onChange={e => setFStatus(e.target.value)}
              className="appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 pr-6 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-32">
              {["All", ...LEAD_STATUSES].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Source</label>
          <div className="relative">
            <select value={fSource} onChange={e => setFSource(e.target.value)}
              className="appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 pr-6 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-32">
              {["All", ...LEAD_SOURCES].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Priority</label>
          <div className="relative">
            <select value={fPriority} onChange={e => setFPriority(e.target.value)}
              className="appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 pr-6 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-28">
              {["All", ...PRIORITIES].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Search</label>
          <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Name or phone..."
            className="border border-gray-300 rounded bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-40" />
        </div>
      </CRMFilterBar>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{rows.length} leads</span>
      </div>

      <div className="mt-2">
        <CRMTable loading={loading}
          columns={["Lead ID", "Name", "Mobile", "Source", "Treatment", "Assigned To", "Follow-up", "Status", "Priority", "Actions"]}
          rows={rows.map(r => [
            <span className="font-mono text-[10px] text-gray-400">{r.id.slice(0, 8)}</span>,
            <button className="text-blue-600 hover:underline font-medium text-xs">{r.name ?? "—"}</button>,
            <span className="font-mono">{r.phone ?? "—"}</span>,
            r.source ?? "—",
            r.treatment_interest ?? "—",
            r.assigned_name,
            fmtDate(r.follow_up_date),
            <CRMStatusBadge status={r.status} />,
            <PriorityBadge priority={r.priority ?? "Medium"} />,
            <button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-4 w-4" /></button>,
          ])}
        />
      </div>
    </div>
  );
}

// ─── Add Lead ─────────────────────────────────────────────────────────────────

export function AddLead({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const profiles = useProfiles();
  const branches = useBranches();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fFirst,    setFFirst]    = useState("");
  const [fLast,     setFLast]     = useState("");
  const [fPhone,    setFPhone]    = useState("");
  const [fEmail,    setFEmail]    = useState("");
  const [fGender,   setFGender]   = useState("Male");
  const [fDob,      setFDob]      = useState("");
  const [fAddress,  setFAddress]  = useState("");
  const [fSource,   setFSource]   = useState(LEAD_SOURCES[0]);
  const [fTreatment,setFTreatment]= useState(TREATMENTS[0]);
  const [fBudget,   setFBudget]   = useState(BUDGET_RANGES[0]);
  const [fDoctor,   setFDoctor]   = useState("");
  const [fPriority, setFPriority] = useState("Medium");
  const [fFollowUp, setFFollowUp] = useState(today());
  const [fSms,      setFSms]      = useState(true);
  const [fWa,       setFWa]       = useState(true);
  const [fEmailOpt, setFEmailOpt] = useState(true);
  const [fNotes,    setFNotes]    = useState("");

  const branchMap  = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.name, p.id]));

  const reset = () => {
    setFFirst(""); setFLast(""); setFPhone(""); setFEmail(""); setFAddress("");
    setFSource(LEAD_SOURCES[0]); setFTreatment(TREATMENTS[0]); setFBudget(BUDGET_RANGES[0]);
    setFDoctor(""); setFPriority("Medium"); setFFollowUp(today());
    setFSms(true); setFWa(true); setFEmailOpt(true); setFNotes(""); setError(null);
  };

  const save = async () => {
    if (!fFirst || !fPhone) { setError("First Name and Mobile are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_leads").insert({
      created_by: user?.id ?? null,
      assigned_to: profileMap[fDoctor] ?? null,
      name: `${fFirst} ${fLast}`.trim(),
      first_name: fFirst, last_name: fLast || null,
      phone: fPhone, email: fEmail || null,
      gender: fGender, date_of_birth: fDob || null,
      address: fAddress || null,
      source: fSource, treatment_interest: fTreatment,
      budget_range: fBudget,
      priority: fPriority,
      follow_up_date: fFollowUp || null,
      sms_opt_in: fSms, whatsapp_opt_in: fWa, email_opt_in: fEmailOpt,
      notes: fNotes || null,
      status: "New",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setSuccess(true); reset();
    setTimeout(() => { setSuccess(false); onNavigate("lead-list"); }, 1500);
  };

  return (
    <div>
      <CRMPageHeader title="Add New Lead" />
      {error   && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>}
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Lead added successfully! Redirecting...</div>}

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <CInput label="First Name" value={fFirst} onChange={setFFirst} required />
            <CInput label="Last Name"  value={fLast}  onChange={setFLast} />
            <CInput label="Mobile Number" value={fPhone} onChange={setFPhone} required placeholder="+91 98765 43210" />
            <CInput label="Email"      value={fEmail}   onChange={setFEmail} type="email" />
            <CSelect label="Gender"    options={["Male","Female","Other"]} value={fGender} onChange={setFGender} />
            <CDate   label="Date of Birth" value={fDob} onChange={setFDob} />
            <CInput  label="Address"   value={fAddress} onChange={setFAddress} className="md:col-span-3" />
          </div>
        </div>

        {/* Lead Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">Lead Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <CSelect label="Lead Source"          options={LEAD_SOURCES}   value={fSource}    onChange={setFSource} />
            <CSelect label="Interested Treatment" options={TREATMENTS}     value={fTreatment} onChange={setFTreatment} />
            <CSelect label="Budget Range"         options={BUDGET_RANGES}  value={fBudget}    onChange={setFBudget} />
            <CSelect label="Assigned Doctor"      options={["Unassigned", ...profiles.map(p=>p.name)]} value={fDoctor} onChange={setFDoctor} />
            <CSelect label="Priority"             options={["High","Medium","Low"]} value={fPriority} onChange={setFPriority} />
            <CDate   label="Expected Conversion / Follow-up Date" value={fFollowUp} onChange={setFFollowUp} />
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">Communication Preferences</h3>
          <div className="flex gap-6">
            {[
              { label: "SMS",       checked: fSms,      set: setFSms },
              { label: "WhatsApp",  checked: fWa,       set: setFWa },
              { label: "Email",     checked: fEmailOpt, set: setFEmailOpt },
            ].map(opt => (
              <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)}
                  className="accent-[#1e2d5a] w-4 h-4" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">Notes</h3>
          <CTextarea label="Lead Notes" value={fNotes} onChange={setFNotes} rows={4} placeholder="Add any relevant notes about this lead..." />
        </div>

        <div className="flex gap-3">
          <PrimaryBtn onClick={save}>{saving ? "Saving..." : "SAVE LEAD"}</PrimaryBtn>
          <GhostBtn onClick={reset}>RESET</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Follow-ups ──────────────────────────────────────────────────────────

export function LeadFollowups() {
  const profiles = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected,setSelected]= useState<any | null>(null);
  const [modal,   setModal]   = useState(false);

  // follow-up form
  const [fDate,   setFDate]   = useState(today());
  const [fType,   setFType]   = useState("Call");
  const [fNotes,  setFNotes]  = useState("");
  const [fOutcome,setFOutcome]= useState("");
  const [fNext,   setFNext]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const { user } = useAuth();

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_leads")
      .select("*")
      .not("status", "in", '("Converted","Lost")')
      .order("follow_up_date");
    setRows((data ?? []).map((r: any) => ({ ...r, assigned_name: profileMap[r.assigned_to] ?? "—" })));
    setLoading(false);
  }, [profiles]);

  const saveFollowup = async () => {
    if (!selected || !fDate) return;
    setSaving(true);
    await supabase.from("lead_followups").insert({
      created_by: user?.id ?? null,
      lead_id: selected.id,
      followup_date: fDate, followup_type: fType,
      notes: fNotes || null, outcome: fOutcome || null, next_action: fNext || null,
      status: "Pending",
    });
    // update lead's follow_up_date
    if (fNext) await supabase.from("crm_leads").update({ follow_up_date: fNext, updated_at: new Date().toISOString() }).eq("id", selected.id);
    setSaving(false); setModal(false);
    setFDate(today()); setFNotes(""); setFOutcome(""); setFNext("");
    load();
  };

  const markConverted = async (id: string) => {
    await supabase.from("crm_leads").update({ status: "Converted", updated_at: new Date().toISOString() }).eq("id", id);
    setModal(false); load();
  };

  const markLost = async (id: string) => {
    await supabase.from("crm_leads").update({ status: "Lost", updated_at: new Date().toISOString() }).eq("id", id);
    setModal(false); load();
  };

  return (
    <div>
      <CRMPageHeader title="Lead Follow-ups" />
      <CRMFilterBar onView={load} onReset={() => setRows([])}>
        <div className="text-xs text-gray-400">Click View to load follow-ups</div>
      </CRMFilterBar>
      <div className="mt-3">
        <CRMTable loading={loading}
          columns={["Lead Name", "Phone", "Next Follow-up", "Source", "Treatment", "Assigned", "Status", "Priority", "Actions"]}
          rows={rows.map(r => [
            <button className="text-blue-600 hover:underline font-medium">{r.name}</button>,
            <span className="font-mono">{r.phone ?? "—"}</span>,
            fmtDate(r.follow_up_date),
            r.source ?? "—",
            r.treatment_interest ?? "—",
            r.assigned_name,
            <CRMStatusBadge status={r.status} />,
            <PriorityBadge priority={r.priority ?? "Medium"} />,
            <div className="flex gap-1">
              <button onClick={() => { setSelected(r); setModal(true); }}
                className="text-[10px] bg-[#1e2d5a] text-white px-2 py-0.5 rounded hover:bg-[#1a2650]">Follow-up</button>
              <button onClick={() => markConverted(r.id)} className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700">Convert</button>
              <button onClick={() => markLost(r.id)} className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600">Lost</button>
            </div>,
          ])}
        />
      </div>

      {/* Follow-up modal */}
      <CRMModal title={`Log Follow-up — ${selected?.name ?? ""}`} open={modal} onClose={() => setModal(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CDate   label="Follow-up Date & Time" value={fDate}    onChange={setFDate}    required />
            <CSelect label="Follow-up Type"  options={["Call","WhatsApp","Email","Visit","Video Call"]} value={fType} onChange={setFType} />
          </div>
          <CTextarea label="Discussion Notes" value={fNotes}   onChange={setFNotes} rows={3} />
          <CInput    label="Outcome"          value={fOutcome} onChange={setFOutcome} placeholder="e.g. Interested, will call back" />
          <CDate     label="Next Follow-up Date" value={fNext} onChange={setFNext} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={saveFollowup}>{saving ? "Saving..." : "Save Follow-up"}</PrimaryBtn>
            {selected && <GhostBtn onClick={() => markConverted(selected.id)}>Mark Converted</GhostBtn>}
            {selected && <button onClick={() => markLost(selected?.id)} className="text-xs text-red-500 hover:underline">Mark Lost</button>}
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Filtered lead lists (Missed, Converted, Lost) ────────────────────────────

function FilteredLeadList({ title, statusFilter, dateFilter }: {
  title: string;
  statusFilter?: string;
  dateFilter?: "overdue";
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const profiles = useProfiles();
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("crm_leads").select("*").order("updated_at", { ascending: false });
    if (statusFilter) q = q.eq("status", statusFilter);
    if (dateFilter === "overdue") {
      q = supabase.from("crm_leads").select("*")
        .lt("follow_up_date", today())
        .not("status", "in", '("Converted","Lost")')
        .order("follow_up_date");
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({ ...r, assigned_name: profileMap[r.assigned_to] ?? "—" })));
    setLoading(false);
  }, [profiles, statusFilter, dateFilter]);

  return (
    <div>
      <CRMPageHeader title={title} />
      <div className="mb-3">
        <PrimaryBtn onClick={load}>Load {title}</PrimaryBtn>
      </div>
      <CRMTable loading={loading}
        columns={["Name","Phone","Source","Treatment","Follow-up Date","Status","Priority"]}
        rows={rows.map(r => [
          <button className="text-blue-600 hover:underline font-medium">{r.name}</button>,
          <span className="font-mono">{r.phone ?? "—"}</span>,
          r.source ?? "—", r.treatment_interest ?? "—",
          fmtDate(r.follow_up_date),
          <CRMStatusBadge status={r.status} />,
          <PriorityBadge priority={r.priority ?? "Medium"} />,
        ])}
      />
    </div>
  );
}

export const MissedFollowups  = () => <FilteredLeadList title="Missed Follow-ups"  dateFilter="overdue" />;
export const ConvertedLeads   = () => <FilteredLeadList title="Converted Leads"    statusFilter="Converted" />;
export const LostLeads        = () => <FilteredLeadList title="Lost Leads"         statusFilter="Lost" />;
