import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, STable, SModal,
  SBadge, SActionRow, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── Treatment Categories ─────────────────────────────────────────────────────

export function TreatmentCategories() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");
  const [fDesc,   setFDesc]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("treatment_categories").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("treatment_categories").insert({ name: fName, description: fDesc || null, status: "Active" });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); setFDesc(""); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("treatment_categories").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Treatment Categories" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Category" />} />
      <STable loading={loading}
        columns={["Category Name","Description","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.description ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title="Add Treatment Category" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput    label="Category Name" value={fName} onChange={setFName} required />
          <STextarea label="Description"   value={fDesc} onChange={setFDesc} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="CREATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Treatment Master ─────────────────────────────────────────────────────────

export function TreatmentMaster() {
  const [rows,       setRows]       = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [taxes,      setTaxes]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState<any | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fCat,      setFCat]      = useState("");
  const [fDesc,     setFDesc]     = useState("");
  const [fDuration, setFDuration] = useState("30");
  const [fPrice,    setFPrice]    = useState("");
  const [fTax,      setFTax]      = useState("");
  const [fNotes,    setFNotes]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: tData }, { data: cData }, { data: taxData }] = await Promise.all([
      supabase.from("treatments").select("*").order("name"),
      supabase.from("treatment_categories").select("id, name").eq("status", "Active"),
      supabase.from("taxes").select("id, name, percentage").eq("status", "Active"),
    ]);
    setRows(tData ?? []);
    setCategories(cData ?? []);
    setTaxes(taxData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const catOptions = ["Select Category", ...categories.map(c => c.name)];
  const taxOptions = ["No Tax", ...taxes.map(t => `${t.name} (${t.percentage}%)`)]

  const openAdd = () => {
    setEditing(null); setFName(""); setFCat(""); setFDesc(""); setFDuration("30");
    setFPrice(""); setFTax(""); setFNotes(""); setError(null); setModal(true);
  };
  const openEdit = (r: any) => {
    setEditing(r); setFName(r.name); setFCat(r.category_name ?? ""); setFDesc(r.description ?? "");
    setFDuration(String(r.duration_minutes ?? 30)); setFPrice(String(r.base_price ?? ""));
    setFTax(r.tax_name ?? ""); setFNotes(r.notes ?? ""); setError(null); setModal(true);
  };

  const save = async () => {
    if (!fName || !fPrice) { setError("Name and price are required."); return; }
    setSaving(true); setError(null);
    const payload = {
      name: fName,
      category_name: fCat !== "Select Category" ? fCat : null,
      description: fDesc || null,
      duration_minutes: Number(fDuration) || 30,
      base_price: Number(fPrice),
      tax_name: fTax !== "No Tax" ? fTax : null,
      notes: fNotes || null,
      status: "Active",
    };
    const { error: err } = editing
      ? await supabase.from("treatments").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editing.id)
      : await supabase.from("treatments").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("treatments").update({ status: current === "Active" ? "Inactive" : "Active", updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Treatment Master" subtitle="Define all treatments with pricing and duration"
        rightSlot={<NewButton onClick={openAdd} label="+ Add Treatment" />} />
      <STable loading={loading}
        columns={["Treatment Name","Category","Duration","Price","Tax","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.category_name ?? "—",
          `${r.duration_minutes ?? 30} min`,
          <span className="font-semibold text-[#1e2d5a]">₹{Number(r.base_price || 0).toLocaleString("en-IN")}</span>,
          r.tax_name ?? "No Tax",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />

      <SModal title={editing ? "Edit Treatment" : "Add Treatment"} open={modal} onClose={() => setModal(false)} width="max-w-2xl">
        <div className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <SInput  label="Treatment Name"      value={fName}     onChange={setFName}     required className="col-span-2" />
            <SSelect label="Category"            options={catOptions} value={fCat}          onChange={setFCat} />
            <SInput  label="Duration (minutes)"  value={fDuration} onChange={setFDuration} type="number" />
            <SInput  label="Base Price (₹)"      value={fPrice}    onChange={setFPrice}    required type="number" />
            <SSelect label="Tax"                 options={taxOptions} value={fTax}          onChange={setFTax} />
            <STextarea label="Description"       value={fDesc}     onChange={setFDesc}     className="col-span-2" />
            <STextarea label="Notes"             value={fNotes}    onChange={setFNotes}    className="col-span-2" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label={editing ? "UPDATE" : "ADD TREATMENT"} />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Prescription Templates ───────────────────────────────────────────────────

export function PrescriptionTemplates() {
  const [templates, setTemplates] = useState([
    { name: "Post-Root Canal Care",    category: "Endodontics",   items: 3 },
    { name: "Post-Extraction Care",    category: "Oral Surgery",  items: 4 },
    { name: "Orthodontic Maintenance", category: "Orthodontics",  items: 2 },
    { name: "Scaling After-Care",      category: "General",       items: 3 },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");
  const [fCat,  setFCat]  = useState("General");
  const [fBody, setFBody] = useState("");

  return (
    <div>
      <SPageHeader title="Prescription Templates" rightSlot={<NewButton onClick={() => setModal(true)} label="+ New Template" />} />
      <STable
        columns={["Template Name","Category","Items","Actions"]}
        rows={templates.map((t, i) => [
          <span className="font-medium">{t.name}</span>,
          t.category,
          `${t.items} medicines`,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => setTemplates(p => p.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>
          </div>,
        ])}
      />
      <SModal title="New Prescription Template" open={modal} onClose={() => setModal(false)} width="max-w-xl">
        <div className="space-y-3">
          <SInput    label="Template Name" value={fName} onChange={setFName} required />
          <SSelect   label="Category"      options={["General","Endodontics","Oral Surgery","Orthodontics","Periodontics"]} value={fCat} onChange={setFCat} />
          <STextarea label="Medications (one per line)" value={fBody} onChange={setFBody} rows={6} placeholder="e.g. Amoxicillin 500mg — 3x daily for 5 days" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setTemplates(p => [...p, { name: fName, category: fCat, items: fBody.split("\n").filter(Boolean).length }]); setModal(false); setFName(""); setFBody(""); } }} label="SAVE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Clinical Notes Templates ─────────────────────────────────────────────────

export function ClinicalNotesTemplates() {
  const [templates, setTemplates] = useState([
    { name: "Routine Checkup Note",       category: "General",    status: "Active" },
    { name: "Root Canal Treatment Note",  category: "Endodontics",status: "Active" },
    { name: "Scaling & Polishing Note",   category: "General",    status: "Active" },
    { name: "Implant Placement Note",     category: "Surgery",    status: "Active" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");
  const [fCat,  setFCat]  = useState("General");
  const [fBody, setFBody] = useState("");

  return (
    <div>
      <SPageHeader title="Clinical Notes Templates" rightSlot={<NewButton onClick={() => setModal(true)} label="+ New Template" />} />
      <STable
        columns={["Template Name","Category","Status","Actions"]}
        rows={templates.map((t, i) => [
          <span className="font-medium">{t.name}</span>,
          t.category, <SBadge status={t.status} />,
          <div className="flex gap-1">
            <button className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => setTemplates(p => p.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>
          </div>,
        ])}
      />
      <SModal title="New Clinical Notes Template" open={modal} onClose={() => setModal(false)} width="max-w-xl">
        <div className="space-y-3">
          <SInput    label="Template Name" value={fName} onChange={setFName} required />
          <SSelect   label="Category"      options={["General","Endodontics","Surgery","Orthodontics","Periodontics"]} value={fCat} onChange={setFCat} />
          <STextarea label="Template Content" value={fBody} onChange={setFBody} rows={8}
            placeholder="Chief Complaint: {{complaint}}&#10;Examination: {{findings}}&#10;Diagnosis: {{diagnosis}}&#10;Treatment Done: {{treatment}}" />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setTemplates(p => [...p, { name: fName, category: fCat, status: "Active" }]); setModal(false); setFName(""); setFBody(""); } }} label="SAVE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
