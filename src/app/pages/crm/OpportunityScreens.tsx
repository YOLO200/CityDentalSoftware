import { useState, useCallback, useEffect } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useProfiles } from "../admin/primitives";
import {
  KPICard, CRMPageHeader, CRMTable, CRMFilterBar, CRMModal, KanbanCard,
  CRMStatusBadge, PriorityBadge, PrimaryBtn, GhostBtn,
  CInput, CSelect, CDate, CTextarea,
  OPP_STAGES, TREATMENTS, PRIORITIES, fmtDate,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];
const COLORS = ["#1e2d5a","#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444"];

// ─── Opportunity Dashboard ────────────────────────────────────────────────────

export function OpportunityDashboard() {
  const [opps,    setOpps]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("crm_opportunities").select("*").then(({ data }) => {
      setOpps(data ?? []);
      setLoading(false);
    });
  }, []);

  const active    = opps.filter(o => o.stage !== "Converted" && o.stage !== "Lost");
  const converted = opps.filter(o => o.stage === "Converted");
  const lost      = opps.filter(o => o.stage === "Lost");
  const pipeline  = active.reduce((s, o) => s + Number(o.estimated_value || 0), 0);

  const byStage = OPP_STAGES.slice(0, -2).map(s => ({
    stage: s.length > 14 ? s.slice(0, 14) + "…" : s,
    count: opps.filter(o => o.stage === s).length,
  }));

  const doctorMap: Record<string, number> = {};
  opps.forEach(o => { if (o.doctor_name) doctorMap[o.doctor_name] = (doctorMap[o.doctor_name] ?? 0) + 1; });
  const byDoc = Object.entries(doctorMap).map(([doctor, count]) => ({ doctor: doctor.replace("Dr. ", ""), count }));

  return (
    <div className="space-y-5">
      <CRMPageHeader title="Opportunity Dashboard" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Active Opportunities" value={active.length}                     color="text-[#1e2d5a]" />
        <KPICard label="Pipeline Value"       value={`₹${(pipeline/1000).toFixed(0)}K`} color="text-blue-600" />
        <KPICard label="Converted"            value={converted.length}                  color="text-green-600" />
        <KPICard label="Lost"                 value={lost.length}                       color="text-red-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Pipeline by Stage</p>
          {loading ? <div className="h-40 animate-pulse bg-gray-50 rounded" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStage}>
                <XAxis dataKey="stage" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e2d5a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Opportunities by Doctor</p>
          {loading ? <div className="h-40 animate-pulse bg-gray-50 rounded" /> : byDoc.length === 0
            ? <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No data yet</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byDoc} dataKey="count" nameKey="doctor" cx="50%" cy="50%" outerRadius={70}
                    label={({ doctor, count }) => `${doctor}: ${count}`} fontSize={9}>
                    {byDoc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>
    </div>
  );
}

// ─── Opportunity Pipeline (Kanban) ────────────────────────────────────────────

export function OpportunityPipeline() {
  const { user }  = useAuth();
  const profiles  = useProfiles();
  const [opps,     setOpps]      = useState<any[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [addModal, setAddModal]  = useState(false);
  const [saving,   setSaving]    = useState(false);
  const [error,    setError]     = useState<string | null>(null);

  const [fTitle,    setFTitle]    = useState("");
  const [fTreat,    setFTreat]    = useState(TREATMENTS[0]);
  const [fValue,    setFValue]    = useState("");
  const [fDoctor,   setFDoctor]   = useState("");
  const [fPriority, setFPriority] = useState("Medium");
  const [fDate,     setFDate]     = useState(today());
  const [fNotes,    setFNotes]    = useState("");

  const doctorOptions = ["Unassigned", ...profiles.map(p => p.name)];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_opportunities").select("*").order("created_at", { ascending: false });
    setOpps(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveOpp = async (id: string, dir: "left" | "right") => {
    const opp = opps.find(o => o.id === id);
    if (!opp) return;
    const idx  = OPP_STAGES.indexOf(opp.stage);
    const next = dir === "right" ? OPP_STAGES[Math.min(idx + 1, OPP_STAGES.length - 1)] : OPP_STAGES[Math.max(idx - 1, 0)];
    setOpps(prev => prev.map(o => o.id === id ? { ...o, stage: next } : o));
    await supabase.from("crm_opportunities").update({ stage: next, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const addOpp = async () => {
    if (!fTitle) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_opportunities").insert({
      created_by: user?.id ?? null,
      title: fTitle, treatment_type: fTreat,
      estimated_value: Number(fValue) || 0,
      doctor_name: fDoctor !== "Unassigned" ? fDoctor : null,
      stage: "New Inquiry", priority: fPriority,
      follow_up_date: fDate || null, notes: fNotes || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setAddModal(false);
    setFTitle(""); setFValue(""); setFDate(today()); setFNotes(""); setError(null);
    load();
  };

  const STAGE_COLORS: Record<string, string> = {
    "New Inquiry":              "border-blue-300 bg-blue-50",
    "Consultation Scheduled":   "border-indigo-300 bg-indigo-50",
    "Treatment Discussed":      "border-purple-300 bg-purple-50",
    "Negotiation":              "border-amber-300 bg-amber-50",
    "Payment Pending":          "border-orange-300 bg-orange-50",
    "Converted":                "border-green-300 bg-green-50",
    "Lost":                     "border-red-300 bg-red-50",
  };

  return (
    <div>
      <CRMPageHeader title="Opportunity Pipeline" rightSlot={
        <PrimaryBtn onClick={() => setAddModal(true)}><Plus className="h-3.5 w-3.5 inline mr-1" />Add Opportunity</PrimaryBtn>
      } />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-4">
            {OPP_STAGES.map(stage => {
              const cards = opps.filter(o => o.stage === stage);
              return (
                <div key={stage} className={`w-52 flex-shrink-0 rounded-xl border-2 ${STAGE_COLORS[stage] ?? "border-gray-200 bg-gray-50"} p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide leading-tight">{stage}</span>
                    <span className="text-[10px] bg-white rounded-full px-1.5 py-0.5 font-semibold text-gray-500 border border-gray-200">{cards.length}</span>
                  </div>
                  {cards.length > 0 && (
                    <div className="text-[10px] text-gray-400 mb-2">
                      ₹{cards.reduce((s,c) => s + Number(c.estimated_value||0), 0).toLocaleString("en-IN")}
                    </div>
                  )}
                  <div className="space-y-2">
                    {cards.map(card => (
                      <KanbanCard key={card.id} item={{ ...card, doctor: card.doctor_name }} stages={OPP_STAGES}
                        onMoveLeft={() => moveOpp(card.id, "left")}
                        onMoveRight={() => moveOpp(card.id, "right")}
                      />
                    ))}
                    {cards.length === 0 && (
                      <div className="text-[10px] text-gray-300 text-center py-4">No opportunities</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CRMModal title="Add Opportunity" open={addModal} onClose={() => setAddModal(false)}>
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Title / Lead Name"     value={fTitle}   onChange={setFTitle}   required className="col-span-2" />
            <CSelect label="Treatment"             options={TREATMENTS} value={fTreat}     onChange={setFTreat} />
            <CInput  label="Estimated Value (₹)"   value={fValue}   onChange={setFValue}   type="number" />
            <CSelect label="Doctor"                options={doctorOptions} value={fDoctor}  onChange={setFDoctor} />
            <CSelect label="Priority"              options={PRIORITIES}   value={fPriority} onChange={setFPriority} />
            <CDate   label="Follow-up Date"        value={fDate}    onChange={setFDate} />
            <CTextarea label="Notes"               value={fNotes}   onChange={setFNotes}   className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={addOpp}>{saving ? "Saving..." : "Add Opportunity"}</PrimaryBtn>
            <GhostBtn onClick={() => setAddModal(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Opportunity List ─────────────────────────────────────────────────────────

export function OpportunityList() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fStage,  setFStage]  = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("crm_opportunities").select("*").order("created_at", { ascending: false });
    if (fStage !== "All") q = q.eq("stage", fStage);
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [fStage]);

  return (
    <div>
      <CRMPageHeader title="Opportunity List" />
      <CRMFilterBar onView={load} onReset={() => { setFStage("All"); setRows([]); }}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400">Stage</label>
          <select value={fStage} onChange={e => setFStage(e.target.value)}
            className="appearance-none border border-gray-300 rounded bg-white px-2.5 py-1.5 pr-6 text-xs text-gray-700 outline-none focus:border-[#1e2d5a] w-44">
            {["All", ...OPP_STAGES].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </CRMFilterBar>
      <div className="mt-3">
        <CRMTable loading={loading}
          columns={["Opportunity","Treatment","Value","Doctor","Stage","Priority","Follow-up","Actions"]}
          rows={rows.map(o => [
            <span className="font-medium text-xs">{o.title}</span>,
            o.treatment_type ?? "—",
            <span className="font-semibold">₹{Number(o.estimated_value || 0).toLocaleString("en-IN")}</span>,
            o.doctor_name ?? "—",
            <CRMStatusBadge status={o.stage} />,
            <PriorityBadge priority={o.priority ?? "Medium"} />,
            fmtDate(o.follow_up_date),
            <button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-4 w-4" /></button>,
          ])}
        />
      </div>
    </div>
  );
}

// ─── Closed Won / Closed Lost ─────────────────────────────────────────────────

function ClosedList({ title, stage }: { title: string; stage: string }) {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_opportunities").select("*").eq("stage", stage).order("updated_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, [stage]);

  return (
    <div>
      <CRMPageHeader title={title} />
      <div className="mb-3"><PrimaryBtn onClick={load}>Load {title}</PrimaryBtn></div>
      <CRMTable loading={loading}
        columns={["Opportunity","Treatment","Value","Doctor","Date"]}
        rows={rows.map(o => [
          <span className="font-medium">{o.title}</span>,
          o.treatment_type ?? "—",
          <span className={`font-semibold ${stage === "Converted" ? "text-green-600" : "text-red-500"}`}>
            ₹{Number(o.estimated_value || 0).toLocaleString("en-IN")}
          </span>,
          o.doctor_name ?? "—",
          fmtDate(o.follow_up_date),
        ])}
      />
    </div>
  );
}

export const ClosedWon  = () => <ClosedList title="Closed Won"  stage="Converted" />;
export const ClosedLost = () => <ClosedList title="Closed Lost" stage="Lost" />;
