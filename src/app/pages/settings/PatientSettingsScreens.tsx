import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, STable, SModal,
  SBadge, SActionRow, NewButton, SaveButton, ResetBtn, fmtDate,
} from "./primitives";

// ─── Patient Groups ───────────────────────────────────────────────────────────

export function PatientGroups() {
  const { user }  = useAuth();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");
  const [fDesc,   setFDesc]   = useState("");
  const [fDisc,   setFDisc]   = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("patient_groups").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("patient_groups").insert({
      name: fName, description: fDesc || null,
      discount_percentage: Number(fDisc) || 0, status: "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); setFDesc(""); setFDisc("0"); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("patient_groups").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Patient Groups" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Group" />} />
      <STable loading={loading}
        columns={["Group Name","Description","Discount %","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.description ?? "—",
          <span className="font-semibold text-[#1e2d5a]">{r.discount_percentage ?? 0}%</span>,
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">
              {r.status === "Active" ? "Disable" : "Enable"}
            </button>
          </div>,
        ])}
      />
      <SModal title="Add Patient Group" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput    label="Group Name"       value={fName} onChange={setFName} required />
          <STextarea label="Description"      value={fDesc} onChange={setFDesc} />
          <SInput    label="Discount %"       value={fDisc} onChange={setFDisc} type="number" placeholder="0" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="CREATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Membership Plans ─────────────────────────────────────────────────────────

export function MembershipPlans() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fPrice,    setFPrice]    = useState("");
  const [fDuration, setFDuration] = useState("12");
  const [fDiscount, setFDiscount] = useState("0");
  const [fBenefits, setFBenefits] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("membership_plans").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName || !fPrice) { setError("Name and price are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("membership_plans").insert({
      name: fName, price: Number(fPrice), duration_months: Number(fDuration),
      discount_percentage: Number(fDiscount), benefits: fBenefits || null, status: "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); setFPrice(""); setFBenefits(""); setError(null); load();
  };

  return (
    <div>
      <SPageHeader title="Membership Plans" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Plan" />} />
      <STable loading={loading}
        columns={["Plan Name","Price","Duration","Discount","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          <span className="font-semibold text-[#1e2d5a]">₹{Number(r.price || 0).toLocaleString("en-IN")}</span>,
          `${r.duration_months ?? 12} months`,
          `${r.discount_percentage ?? 0}%`,
          <SBadge status={r.status ?? "Active"} />,
          <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>,
        ])}
      />
      <SModal title="Add Membership Plan" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput    label="Plan Name"           value={fName}     onChange={setFName}     required />
          <div className="grid grid-cols-3 gap-3">
            <SInput  label="Price (₹)"           value={fPrice}    onChange={setFPrice}    type="number" required />
            <SInput  label="Duration (months)"   value={fDuration} onChange={setFDuration} type="number" />
            <SInput  label="Discount %"          value={fDiscount} onChange={setFDiscount} type="number" />
          </div>
          <STextarea label="Benefits"            value={fBenefits} onChange={setFBenefits} placeholder="List key benefits..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="CREATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Referral Sources ─────────────────────────────────────────────────────────

export function ReferralSourcesSettings() {
  const [rows,  setRows]  = useState(["Instagram","Facebook","Google Ads","Walk-in","Doctor Referral","Existing Patient","Website","WhatsApp","Other"].map(n => ({ name: n, status: "Active" })));
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");

  return (
    <div>
      <SPageHeader title="Referral Sources" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Source" />} />
      <STable
        columns={["Source Name","Status","Actions"]}
        rows={rows.map((r, i) => [
          <span className="font-medium">{r.name}</span>,
          <SBadge status={r.status} />,
          <div className="flex gap-1">
            <button onClick={() => setRows(p => p.map((x,j) => j===i ? {...x, status: x.status==="Active"?"Inactive":"Active"} : x))}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
            <button onClick={() => setRows(p => p.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>
          </div>,
        ])}
      />
      <SModal title="Add Referral Source" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput label="Source Name" value={fName} onChange={setFName} required />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setRows(p => [...p, { name: fName, status: "Active" }]); setModal(false); setFName(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Consent Forms ────────────────────────────────────────────────────────────

export function ConsentForms() {
  const [rows, setRows] = useState([
    { name: "General Treatment Consent", category: "General",    status: "Active" },
    { name: "Surgery Consent",           category: "Surgery",    status: "Active" },
    { name: "Anaesthesia Consent",       category: "Anaesthesia",status: "Active" },
    { name: "Orthodontic Treatment",     category: "Orthodontics",status: "Active" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");
  const [fCat,  setFCat]  = useState("General");
  const [fBody, setFBody] = useState("");

  return (
    <div>
      <SPageHeader title="Consent Forms" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Form" />} />
      <STable
        columns={["Form Name","Category","Status","Actions"]}
        rows={rows.map((r, i) => [
          <span className="font-medium">{r.name}</span>,
          r.category, <SBadge status={r.status} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button className="text-[10px] border border-blue-200 text-blue-600 rounded px-2 py-0.5 hover:bg-blue-50">Preview</button>
          </div>,
        ])}
      />
      <SModal title="Add Consent Form" open={modal} onClose={() => setModal(false)} width="max-w-2xl">
        <div className="space-y-3">
          <SInput    label="Form Name" value={fName} onChange={setFName} required />
          <SSelect   label="Category"  options={["General","Surgery","Anaesthesia","Orthodontics","Cosmetic"]} value={fCat} onChange={setFCat} />
          <STextarea label="Form Content" value={fBody} onChange={setFBody} rows={8} placeholder="Enter consent form text..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setRows(p => [...p, { name: fName, category: fCat, status: "Active" }]); setModal(false); setFName(""); setFBody(""); } }} label="SAVE FORM" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Medical History Templates ────────────────────────────────────────────────

export function MedicalHistoryTemplates() {
  const [templates, setTemplates] = useState([
    { name: "Standard Medical History",  fields: 12, status: "Active" },
    { name: "Paediatric Medical History", fields: 8,  status: "Active" },
    { name: "Surgical Pre-Op Screening",  fields: 15, status: "Active" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");
  const COMMON_FIELDS = ["Allergies","Current Medications","Previous Surgeries","Blood Pressure","Diabetes","Heart Conditions","Bleeding Disorders","Pregnancy","Smoking","Alcohol Use","Drug Abuse","Blood Type"];
  const [selected, setSelected] = useState<string[]>(COMMON_FIELDS.slice(0, 8));

  return (
    <div>
      <SPageHeader title="Medical History Templates" rightSlot={<NewButton onClick={() => setModal(true)} label="+ New Template" />} />
      <STable
        columns={["Template Name","Fields","Status","Actions"]}
        rows={templates.map(r => [
          <span className="font-medium">{r.name}</span>,
          `${r.fields} fields`,
          <SBadge status={r.status} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
          </div>,
        ])}
      />
      <SModal title="New Medical History Template" open={modal} onClose={() => setModal(false)} width="max-w-xl">
        <div className="space-y-3">
          <SInput label="Template Name" value={fName} onChange={setFName} required />
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">Select Fields</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {COMMON_FIELDS.map(f => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(f)} onChange={e => setSelected(p => e.target.checked ? [...p, f] : p.filter(x => x !== f))}
                    className="accent-[#1e2d5a] w-4 h-4" />
                  <span className="text-xs text-gray-700">{f}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setTemplates(p => [...p, { name: fName, fields: selected.length, status: "Active" }]); setModal(false); setFName(""); } }} label="SAVE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
