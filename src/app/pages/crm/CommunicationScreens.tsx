import { useState, useCallback, useEffect } from "react";
import { Send, Clock, FileText, Plus, Eye, MessageSquare, Mail } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  CRMPageHeader, CRMTable, CRMFilterBar, CRMModal,
  CRMStatusBadge, KPICard, PrimaryBtn, GhostBtn,
  CInput, CSelect, CTextarea, fmtDate,
} from "./primitives";

const AUDIENCE_OPTIONS = [
  "New Patients", "Pending Treatment", "Overdue Payments",
  "Birthday Patients", "Follow-up Pending", "Membership Expiry",
  "All Active Patients", "Inactive Patients (3+ months)",
];

const CATEGORIES = ["Appointment Reminder", "Payment Reminder", "Birthday Wishes", "Treatment Follow-up", "Membership Renewal", "Marketing Offers"];
const CHANNELS   = ["SMS", "WhatsApp", "Email"];

// ─── Communication Center ─────────────────────────────────────────────────────

export function CommunicationCenter({ defaultChannel = "WhatsApp" }: { defaultChannel?: string }) {
  const { user }  = useAuth();
  const [tab,       setTab]       = useState<"SMS"|"WhatsApp"|"Email">(defaultChannel as any);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [cName,     setCName]     = useState("");
  const [cAudience, setCAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [cTemplate, setCTemplate] = useState("");
  const [cMessage,  setCMessage]  = useState("");
  const [cSchedule, setCSchedule] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cData } = await supabase.from("crm_campaigns")
      .select("*").order("created_at", { ascending: false });
    setCampaigns(cData ?? []);
    const { data: tData } = await supabase.from("crm_templates")
      .select("id, name, body").eq("status", "Active");
    setTemplates(tData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = campaigns.filter(c => c.channel === tab);

  const saveCampaign = async (status: "Draft" | "Scheduled" | "Sent") => {
    if (!cName) { setError("Campaign name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_campaigns").insert({
      created_by: user?.id ?? null,
      name: cName, channel: tab, audience: cAudience,
      message_body: cMessage || null,
      scheduled_at: cSchedule ? new Date(cSchedule).toISOString() : null,
      status,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false);
    setCName(""); setCAudience(AUDIENCE_OPTIONS[0]); setCTemplate(""); setCMessage(""); setCSchedule("");
    load();
  };

  const totalSent      = filtered.reduce((s,c) => s + (c.sent_count||0), 0);
  const totalDelivered = filtered.reduce((s,c) => s + (c.delivered_count||0), 0);
  const totalFailed    = filtered.reduce((s,c) => s + (c.failed_count||0), 0);
  const deliveryRate   = totalSent > 0 ? `${Math.round(totalDelivered/totalSent*100)}%` : "—";

  const channelIcon = {
    SMS:      <MessageSquare className="h-4 w-4" />,
    WhatsApp: <MessageSquare className="h-4 w-4 text-green-600" />,
    Email:    <Mail className="h-4 w-4" />,
  };

  return (
    <div>
      <CRMPageHeader title="Communication Center" rightSlot={
        <PrimaryBtn onClick={() => setModal(true)}><Plus className="h-3.5 w-3.5 inline mr-1" />New Campaign</PrimaryBtn>
      } />

      {/* Channel tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {(["SMS","WhatsApp","Email"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}>
            {channelIcon[t]} {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3"><div className="text-[10px] text-gray-400 mb-1">Total Sent</div><div className="text-lg font-bold text-[#1e2d5a]">{totalSent.toLocaleString("en-IN")}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-3"><div className="text-[10px] text-gray-400 mb-1">Delivered</div><div className="text-lg font-bold text-[#1e2d5a]">{totalDelivered.toLocaleString("en-IN")}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-3"><div className="text-[10px] text-gray-400 mb-1">Failed</div><div className="text-lg font-bold text-red-500">{totalFailed.toLocaleString("en-IN")}</div></div>
        <div className="bg-white border border-gray-200 rounded-xl p-3"><div className="text-[10px] text-gray-400 mb-1">Delivery Rate</div><div className="text-lg font-bold text-green-600">{deliveryRate}</div></div>
      </div>

      <CRMTable loading={loading}
        columns={["Campaign Name","Audience","Sent","Delivered","Failed","Scheduled Date","Status","Actions"]}
        rows={filtered.map(c => [
          <span className="font-medium text-xs">{c.name}</span>,
          <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{c.audience ?? "—"}</span>,
          c.sent_count ?? 0,
          c.delivered_count ?? 0,
          <span className={(c.failed_count||0) > 0 ? "text-red-500 font-medium" : ""}>{c.failed_count ?? 0}</span>,
          fmtDate(c.scheduled_at),
          <CRMStatusBadge status={c.status} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50"><Eye className="h-3 w-3 inline" /></button>
          </div>,
        ])}
      />

      {/* New Campaign Modal */}
      <CRMModal title="New Campaign" open={modal} onClose={() => setModal(false)} width="max-w-2xl">
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <CInput  label="Campaign Name" value={cName}     onChange={setCName}     required className="col-span-2" />
            <CSelect label="Channel"       options={CHANNELS} value={tab} onChange={v => setTab(v as any)} />
            <CSelect label="Audience"      options={AUDIENCE_OPTIONS} value={cAudience} onChange={setCAudience} />
            <CSelect label="Template"      options={["Select Template", ...templates.map(t => t.name)]} value={cTemplate}
              onChange={v => {
                setCTemplate(v);
                const tpl = templates.find(t => t.name === v);
                if (tpl) setCMessage(tpl.body);
              }} className="col-span-2" />
          </div>
          <CTextarea label="Message Body" value={cMessage} onChange={setCMessage} rows={4} placeholder="Type or select a template..." />
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">Variables:</p>
            {["{{patient_name}}","{{doctor_name}}","{{appointment_date}}","{{amount}}"].map(v => (
              <code key={v} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded mr-1">{v}</code>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Schedule For (leave blank to send now)</label>
            <input type="datetime-local" value={cSchedule} onChange={e => setCSchedule(e.target.value)}
              className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] max-w-xs" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={() => saveCampaign("Sent")}>{saving ? "Saving..." : <><Send className="h-3.5 w-3.5 inline mr-1" />Send Now</>}</PrimaryBtn>
            <GhostBtn onClick={() => saveCampaign("Scheduled")}><Clock className="h-3.5 w-3.5 inline mr-1" />Schedule</GhostBtn>
            <GhostBtn onClick={() => saveCampaign("Draft")}><FileText className="h-3.5 w-3.5 inline mr-1" />Save Draft</GhostBtn>
          </div>
        </div>
      </CRMModal>
    </div>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function Templates() {
  const { user }    = useAuth();
  const [rows,       setRows]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<any | null>(null);
  const [fCat,       setFCat]       = useState("All");
  const [showEditor, setShowEditor] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [eName, setEName]     = useState("");
  const [eBody, setEBody]     = useState("");
  const [eCh,   setECh]       = useState("WhatsApp");
  const [eCat,  setECat]      = useState(CATEGORIES[0]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_templates").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = fCat === "All" ? rows : rows.filter(t => t.category === fCat);

  const openEdit = (t: any) => {
    setSelected(t); setEName(t.name); setEBody(t.body ?? ""); setECh(t.channel ?? "WhatsApp"); setECat(t.category ?? CATEGORIES[0]);
    setShowEditor(true); setError(null);
  };
  const openNew = () => {
    setSelected(null); setEName(""); setEBody(""); setECh("WhatsApp"); setECat(CATEGORIES[0]);
    setShowEditor(true); setError(null);
  };

  const save = async () => {
    if (!eName || !eBody) { setError("Name and body are required."); return; }
    setSaving(true); setError(null);
    if (selected) {
      await supabase.from("crm_templates").update({ name: eName, body: eBody, channel: eCh, category: eCat, updated_at: new Date().toISOString() }).eq("id", selected.id);
    } else {
      await supabase.from("crm_templates").insert({ created_by: user?.id ?? null, name: eName, body: eBody, channel: eCh, category: eCat, status: "Active" });
    }
    setSaving(false); setShowEditor(false); load();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("crm_templates").delete().eq("id", id);
    if (selected?.id === id) setShowEditor(false);
    load();
  };

  return (
    <div>
      <CRMPageHeader title="Message Templates" rightSlot={<PrimaryBtn onClick={openNew}><Plus className="h-3.5 w-3.5 inline mr-1" />New Template</PrimaryBtn>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="border-b border-gray-100 px-3 py-2">
              <select value={fCat} onChange={e => setFCat(e.target.value)}
                className="w-full text-xs border-0 outline-none bg-transparent text-gray-600">
                {["All", ...CATEGORIES].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {loading ? <div className="p-4 text-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent mx-auto" /></div> : (
              <div className="divide-y divide-gray-50">
                {filtered.length === 0 && <p className="text-xs text-gray-300 text-center py-6">No templates yet</p>}
                {filtered.map(t => (
                  <button key={t.id} onClick={() => openEdit(t)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${selected?.id === t.id ? "bg-orange-50 border-l-2 border-orange-400" : ""}`}>
                    <div className="text-xs font-medium text-gray-700">{t.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.channel === "SMS" ? "bg-blue-100 text-blue-600" : t.channel === "WhatsApp" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"}`}>{t.channel}</span>
                      <span className="text-[10px] text-gray-400">{t.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {showEditor ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#1e2d5a] mb-4">{selected ? "Edit Template" : "New Template"}</h3>
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <CInput  label="Template Name" value={eName} onChange={setEName} required className="col-span-2" />
                  <CSelect label="Channel"        options={CHANNELS}    value={eCh}  onChange={setECh} />
                  <CSelect label="Category"       options={CATEGORIES}  value={eCat} onChange={setECat} />
                </div>
                <CTextarea label="Message Body" value={eBody} onChange={setEBody} rows={5}
                  placeholder="Use {{patient_name}}, {{doctor_name}}, {{appointment_date}} as variables..." />
                {eBody && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-gray-500 mb-2">Preview</p>
                    <p className="text-xs text-gray-600 whitespace-pre-line">
                      {eBody
                        .replace(/\{\{patient_name\}\}/g, "Mr. Ranjit Kumar")
                        .replace(/\{\{doctor_name\}\}/g, "Dr. Anand Jasani")
                        .replace(/\{\{appointment_date\}\}/g, "15 May 2026 at 10:00 AM")
                        .replace(/\{\{amount\}\}/g, "1,250")
                        .replace(/\{\{treatment\}\}/g, "Scaling")
                        .replace(/\{\{plan_name\}\}/g, "Gold Membership")
                        .replace(/\{\{expiry_date\}\}/g, "30 Jun 2026")}
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <PrimaryBtn onClick={save}>{saving ? "Saving..." : "Save Template"}</PrimaryBtn>
                  <GhostBtn onClick={() => setShowEditor(false)}>Cancel</GhostBtn>
                  {selected && (
                    <button onClick={() => deleteTemplate(selected.id)} className="ml-auto text-xs text-red-400 hover:text-red-600 hover:underline">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-center h-64">
              <p className="text-gray-300 text-sm">Select a template to edit or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Messaging ───────────────────────────────────────────────────────────

export function BulkMessaging() {
  const { user }   = useAuth();
  const [channel,  setChannel]  = useState("WhatsApp");
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [message,  setMessage]  = useState("");
  const [schedule, setSchedule] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const send = async (status: "Sent" | "Scheduled" | "Draft") => {
    if (!message) { setError("Message body is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("crm_campaigns").insert({
      created_by: user?.id ?? null,
      name: `Bulk ${channel} — ${new Date().toLocaleDateString("en-GB")}`,
      channel, audience, message_body: message,
      scheduled_at: schedule ? new Date(schedule).toISOString() : null,
      status,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setSuccess(true); setMessage(""); setSchedule("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <CRMPageHeader title="Bulk Messaging" />
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
        {error   && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-3">Campaign saved successfully!</p>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CSelect label="Channel"  options={CHANNELS}          value={channel}  onChange={setChannel} />
            <CSelect label="Audience" options={AUDIENCE_OPTIONS}  value={audience} onChange={setAudience} />
          </div>
          <CTextarea label="Message Body" value={message} onChange={setMessage} rows={5}
            placeholder="Use {{patient_name}}, {{doctor_name}} as variables..." />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Schedule (leave blank to send now)</label>
            <input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)}
              className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] max-w-xs" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <PrimaryBtn onClick={() => send("Sent")}>{saving ? "Saving..." : <><Send className="h-3.5 w-3.5 inline mr-1" />Send Now</>}</PrimaryBtn>
            <GhostBtn onClick={() => send("Scheduled")}><Clock className="h-3.5 w-3.5 inline mr-1" />Schedule</GhostBtn>
            <GhostBtn onClick={() => send("Draft")}><FileText className="h-3.5 w-3.5 inline mr-1" />Save Draft</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SMSCampaigns       = () => <CommunicationCenter defaultChannel="SMS" />;
export const WhatsAppCampaigns  = () => <CommunicationCenter defaultChannel="WhatsApp" />;
export const EmailCampaigns     = () => <CommunicationCenter defaultChannel="Email" />;
