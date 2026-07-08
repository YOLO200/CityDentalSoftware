import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, SUploadBox, STable, SModal,
  STabs, SBadge, SToggle, SActionRow, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── Taxes ────────────────────────────────────────────────────────────────────

export function Taxes() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");
  const [fPct,    setFPct]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("taxes").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName || !fPct) { setError("Name and percentage are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("taxes").insert({ name: fName, percentage: Number(fPct), status: "Active" });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); setFPct(""); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("taxes").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Taxes" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Tax" />} />
      <STable loading={loading}
        columns={["Tax Name","Percentage","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          <span className="font-semibold">{r.percentage}%</span>,
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title="Add Tax" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput label="Tax Name"        value={fName} onChange={setFName} required placeholder="e.g. GST 18%" />
          <SInput label="Percentage (%)"  value={fPct}  onChange={setFPct}  required type="number" placeholder="18" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="ADD TAX" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Payment Modes ────────────────────────────────────────────────────────────

export function PaymentModes() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");
  const [fDefault,setFDefault]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_modes").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("payment_modes").insert({ name: fName, status: "Active", is_default: fDefault });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); setFDefault(false); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("payment_modes").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Payment Modes" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Mode" />} />
      <STable loading={loading}
        columns={["Payment Mode","Default","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.is_default ? <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Default</span> : "—",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title="Add Payment Mode" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput  label="Mode Name" value={fName} onChange={setFName} required placeholder="e.g. UPI, Card, Cash..." />
          <SToggle label="Set as default payment mode" checked={fDefault} onChange={setFDefault} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Invoice Template ─────────────────────────────────────────────────────────

export function InvoiceTemplate() {
  const [prefix,  setPrefix]  = useState("INV-");
  const [footer,  setFooter]  = useState("Thank you for choosing City Dental Hospital. For queries, call us at +91 98765 43210.");
  const [showSig, setShowSig] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "invoice_prefix",    value: prefix },
      { key: "invoice_footer",    value: footer },
      { key: "invoice_show_sig",  value: String(showSig) },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Invoice Template" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Saved.</div>}
      <SFormCard title="Header">
        <div className="grid grid-cols-2 gap-4">
          <SUploadBox label="Clinic Logo for Invoice" hint="PNG, JPG — 300×100 px recommended" />
          <SInput label="Invoice Number Prefix" value={prefix} onChange={setPrefix} placeholder="INV-" />
        </div>
      </SFormCard>
      <SFormCard title="Footer & Signature">
        <div className="space-y-3">
          <STextarea label="Footer Text" value={footer} onChange={setFooter} rows={3} />
          <SToggle label="Show Doctor Signature on Invoice" checked={showSig} onChange={setShowSig} />
          {showSig && <SUploadBox label="Signature Image" hint="PNG with transparent background" />}
        </div>
      </SFormCard>
      <SActionRow onSave={save} onReset={() => {}} saving={saving} />
    </div>
  );
}

// ─── Receipt Settings ─────────────────────────────────────────────────────────

export function ReceiptSettings() {
  const [prefix,   setPrefix]   = useState("RCP-");
  const [showQR,   setShowQR]   = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);

  const save = async () => {
    setSaving(true);
    const entries = [
      { key: "receipt_prefix",   value: prefix },
      { key: "receipt_show_qr",  value: String(showQR) },
      { key: "receipt_show_logo",value: String(showLogo) },
    ].map(e => ({ ...e, updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Receipt Settings" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Saved.</div>}
      <SFormCard>
        <div className="space-y-4">
          <SInput  label="Receipt Number Prefix" value={prefix} onChange={setPrefix} />
          <SToggle label="Show QR Code on Receipt"   checked={showQR}   onChange={setShowQR}   description="Patients can scan to pay outstanding balance" />
          <SToggle label="Show Clinic Logo on Receipt" checked={showLogo} onChange={setShowLogo} />
        </div>
        <SActionRow onSave={save} onReset={() => {}} saving={saving} />
      </SFormCard>
    </div>
  );
}

// ─── Discount Rules ───────────────────────────────────────────────────────────

export function DiscountRules() {
  const [rules, setRules] = useState([
    { name: "Senior Citizen Discount",   type: "Patient Group",  value: "10%",  applies: "All Treatments" },
    { name: "Staff Family Discount",     type: "Patient Group",  value: "25%",  applies: "All Treatments" },
    { name: "Membership Gold Discount",  type: "Membership",     value: "15%",  applies: "All Treatments" },
    { name: "Whitening Festive Offer",   type: "Treatment",      value: "20%",  applies: "Teeth Whitening" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName,  setFName]  = useState("");
  const [fType,  setFType]  = useState("Patient Group");
  const [fValue, setFValue] = useState("");
  const [fApply, setFApply] = useState("All Treatments");

  return (
    <div>
      <SPageHeader title="Discount Rules" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Rule" />} />
      <STable
        columns={["Rule Name","Type","Discount","Applies To","Actions"]}
        rows={rules.map((r, i) => [
          <span className="font-medium">{r.name}</span>,
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.type==="Membership"?"bg-purple-100 text-purple-700":r.type==="Treatment"?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700"}`}>{r.type}</span>,
          <span className="font-semibold text-[#1e2d5a]">{r.value}</span>,
          r.applies,
          <button onClick={() => setRules(p => p.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Discount Rule" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput  label="Rule Name"    value={fName}  onChange={setFName}  required />
          <SSelect label="Type"         options={["Patient Group","Membership","Treatment","Doctor"]} value={fType}  onChange={setFType} />
          <SInput  label="Discount %"   value={fValue} onChange={setFValue} type="number" placeholder="10" />
          <SInput  label="Applies To"   value={fApply} onChange={setFApply} placeholder="All Treatments" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName && fValue) { setRules(p => [...p, { name: fName, type: fType, value: `${fValue}%`, applies: fApply }]); setModal(false); setFName(""); setFValue(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Insurance Settings ───────────────────────────────────────────────────────

export function InsuranceSettings() {
  const [providers, setProviders] = useState([
    { name: "Star Health Insurance",  network: "Cashless", status: "Active" },
    { name: "Bajaj Allianz",          network: "Reimbursement", status: "Active" },
    { name: "HDFC ERGO",              network: "Both",      status: "Active" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName,    setFName]    = useState("");
  const [fNetwork, setFNetwork] = useState("Cashless");

  return (
    <div>
      <SPageHeader title="Insurance Settings" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Provider" />} />
      <STable
        columns={["Provider Name","Network Type","Status","Actions"]}
        rows={providers.map((p, i) => [
          <span className="font-medium">{p.name}</span>,
          p.network, <SBadge status={p.status} />,
          <button onClick={() => setProviders(prev => prev.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Insurance Provider" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput  label="Provider Name"  value={fName}    onChange={setFName}    required />
          <SSelect label="Network Type"   options={["Cashless","Reimbursement","Both"]} value={fNetwork} onChange={setFNetwork} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setProviders(p => [...p, { name: fName, network: fNetwork, status: "Active" }]); setModal(false); setFName(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
