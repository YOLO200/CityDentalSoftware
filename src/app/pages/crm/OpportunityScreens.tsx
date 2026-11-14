import { useState, useCallback, useEffect } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useProfiles } from "../admin/primitives";
import {
  CRMPageHeader, CRMTable, CRMFilterBar, CRMModal, KanbanCard, CRMStatusBadge, PriorityBadge, PrimaryBtn, GhostBtn, CInput, CSelect, CDate, CTextarea, OPP_STAGES, TREATMENTS, PRIORITIES, fmtDate,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

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
