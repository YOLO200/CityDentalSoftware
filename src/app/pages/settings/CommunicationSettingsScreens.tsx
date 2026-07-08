import { useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, STabs, STable, SModal,
  SToggle, SActionRow, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── SMS Settings ─────────────────────────────────────────────────────────────

export function SmsSettings() {
  const [gateway,  setGateway]  = useState("Textlocal");
  const [apiKey,   setApiKey]   = useState("");
  const [senderId, setSenderId] = useState("CITYDNTL");
  const [testNo,   setTestNo]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [testMsg,  setTestMsg]  = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "sms_gateway",   value: gateway },
      { key: "sms_api_key",   value: apiKey },
      { key: "sms_sender_id", value: senderId },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="SMS Settings" subtitle="Configure your SMS gateway for appointment reminders and campaigns" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">SMS settings saved.</div>}
      <SFormCard title="Gateway Configuration">
        <div className="grid grid-cols-2 gap-4">
          <SSelect label="SMS Gateway"  options={["Textlocal","MSG91","Twilio","AWS SNS","Exotel"]} value={gateway} onChange={setGateway} />
          <SInput  label="Sender ID"    value={senderId} onChange={setSenderId} placeholder="CITYDNTL" />
          <SInput  label="API Key"      value={apiKey}   onChange={setApiKey}   type="password" className="col-span-2" />
        </div>
      </SFormCard>
      <SFormCard title="Test SMS">
        <div className="flex gap-3 items-end">
          <SInput label="Test Mobile Number" value={testNo} onChange={setTestNo} placeholder="+91 98765 43210" className="flex-1" />
          <button onClick={() => setTestMsg("Test SMS sent to " + testNo)}
            className="bg-[#1e2d5a] text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <Send className="h-3.5 w-3.5" />Send Test SMS
          </button>
        </div>
        {testMsg && <p className="text-xs text-green-600 mt-2">{testMsg}</p>}
      </SFormCard>
      <SActionRow onSave={save} onReset={() => { setGateway("Textlocal"); setApiKey(""); setSenderId("CITYDNTL"); }} saving={saving} />
    </div>
  );
}

// ─── WhatsApp Settings ────────────────────────────────────────────────────────

export function WhatsAppSettings() {
  const [provider,  setProvider]  = useState("Twilio");
  const [apiKey,    setApiKey]    = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [testNo,    setTestNo]    = useState("");
  const [saving,    setSaving]    = useState(false);
  const [testMsg,   setTestMsg]   = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "wa_provider",       value: provider },
      { key: "wa_api_key",        value: apiKey },
      { key: "wa_business_number",value: bizNumber },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="WhatsApp Settings" subtitle="Connect WhatsApp Business API for patient communication" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">WhatsApp settings saved.</div>}
      <SFormCard title="API Configuration">
        <div className="grid grid-cols-2 gap-4">
          <SSelect label="WhatsApp API Provider" options={["Twilio","360Dialog","WATI","AiSensy","Interakt"]} value={provider} onChange={setProvider} />
          <SInput  label="Business Number"       value={bizNumber} onChange={setBizNumber} placeholder="+91 98765 43210" />
          <SInput  label="API Key / Token"       value={apiKey}    onChange={setApiKey}    type="password" className="col-span-2" />
        </div>
      </SFormCard>
      <SFormCard title="Test Message">
        <div className="flex gap-3 items-end">
          <SInput label="Send Test To" value={testNo} onChange={setTestNo} placeholder="+91 98765 43210" className="flex-1" />
          <button onClick={() => setTestMsg("Test WhatsApp message sent to " + testNo)}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <Send className="h-3.5 w-3.5" />Send Test
          </button>
        </div>
        {testMsg && <p className="text-xs text-green-600 mt-2">{testMsg}</p>}
      </SFormCard>
      <SActionRow onSave={save} onReset={() => { setProvider("Twilio"); setApiKey(""); setBizNumber(""); }} saving={saving} />
    </div>
  );
}

// ─── Email Settings ───────────────────────────────────────────────────────────

export function EmailSettings() {
  const [host,    setHost]    = useState("smtp.gmail.com");
  const [port,    setPort]    = useState("587");
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [fromName,setFromName]= useState("City Dental Hospital");
  const [testTo,  setTestTo]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "smtp_host",      value: host },
      { key: "smtp_port",      value: port },
      { key: "smtp_user",      value: user },
      { key: "smtp_from_name", value: fromName },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Email Settings" subtitle="Configure SMTP for transactional emails and notifications" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Email settings saved.</div>}
      <SFormCard title="SMTP Configuration">
        <div className="grid grid-cols-2 gap-4">
          <SInput  label="SMTP Host"         value={host}     onChange={setHost}     placeholder="smtp.gmail.com" />
          <SInput  label="SMTP Port"         value={port}     onChange={setPort}     placeholder="587" type="number" />
          <SInput  label="Username / Email"  value={user}     onChange={setUser}     type="email" />
          <SInput  label="Password"          value={pass}     onChange={setPass}     type="password" />
          <SInput  label="From Name"         value={fromName} onChange={setFromName} className="col-span-2" />
        </div>
      </SFormCard>
      <SFormCard title="Test Email">
        <div className="flex gap-3 items-end">
          <SInput label="Send Test To" value={testTo} onChange={setTestTo} type="email" placeholder="test@example.com" className="flex-1" />
          <button onClick={() => setTestMsg("Test email sent to " + testTo)}
            className="bg-purple-600 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <Send className="h-3.5 w-3.5" />Send Test
          </button>
        </div>
        {testMsg && <p className="text-xs text-green-600 mt-2">{testMsg}</p>}
      </SFormCard>
      <SActionRow onSave={save} onReset={() => { setHost("smtp.gmail.com"); setPort("587"); setUser(""); setPass(""); }} saving={saving} />
    </div>
  );
}

// ─── Notification Templates ───────────────────────────────────────────────────

export function NotificationTemplates() {
  const NOTIF_TEMPLATES = [
    { event: "Appointment Confirmation", channel: "WhatsApp", enabled: true },
    { event: "Appointment Reminder",     channel: "SMS",      enabled: true },
    { event: "Appointment Cancelled",    channel: "WhatsApp", enabled: true },
    { event: "Payment Received",         channel: "SMS",      enabled: true },
    { event: "Payment Due Reminder",     channel: "Email",    enabled: false },
    { event: "Birthday Greeting",        channel: "WhatsApp", enabled: true },
    { event: "Treatment Follow-up",      channel: "SMS",      enabled: true },
    { event: "Membership Renewal",       channel: "Email",    enabled: false },
  ];
  const [templates, setTemplates] = useState(NOTIF_TEMPLATES);
  const [modal,     setModal]     = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [body,      setBody]      = useState("");

  const toggle = (i: number) => setTemplates(p => p.map((t, j) => j === i ? { ...t, enabled: !t.enabled } : t));

  return (
    <div>
      <SPageHeader title="Notification Templates" subtitle="Manage automated messages sent for key events" />
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {templates.map((t, i) => (
          <div key={t.event} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${t.enabled ? "bg-green-500" : "bg-gray-300"}`} />
              <div>
                <div className="text-xs font-medium text-gray-700">{t.event}</div>
                <div className="text-[10px] text-gray-400">via {t.channel}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedIdx(i); setBody(""); setModal(true); }}
                className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-100">Edit Template</button>
              <SToggle label="" checked={t.enabled} onChange={() => toggle(i)} />
            </div>
          </div>
        ))}
      </div>

      <SModal title={selectedIdx !== null ? `Edit: ${templates[selectedIdx]?.event}` : "Edit Template"} open={modal} onClose={() => setModal(false)} width="max-w-xl">
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600">
            Available variables: <code>{"{{patient_name}}"}</code> <code>{"{{doctor_name}}"}</code> <code>{"{{appointment_date}}"}</code> <code>{"{{amount}}"}</code>
          </div>
          <STextarea label="Template Body" value={body} onChange={setBody} rows={6}
            placeholder="Dear {{patient_name}}, your appointment is confirmed for {{appointment_date}}..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => setModal(false)} label="SAVE TEMPLATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
