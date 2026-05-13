import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  SPageHeader, SInput, SSelect, STextarea, STable, SModal,
  SBadge, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── Labs ─────────────────────────────────────────────────────────────────────

export function Labs() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,    setFName]    = useState("");
  const [fContact, setFContact] = useState("");
  const [fPhone,   setFPhone]   = useState("");
  const [fEmail,   setFEmail]   = useState("");
  const [fAddress, setFAddress] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("labs").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setFName(""); setFContact(""); setFPhone(""); setFEmail(""); setFAddress(""); setError(null); };
  const openAdd  = () => { setEditing(null); reset(); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setFName(r.name); setFContact(r.contact_name ?? ""); setFPhone(r.phone ?? ""); setFEmail(r.email ?? ""); setFAddress(r.address ?? ""); setError(null); setModal(true); };

  const save = async () => {
    if (!fName) { setError("Lab name is required."); return; }
    setSaving(true); setError(null);
    const payload = { name: fName, contact_name: fContact || null, phone: fPhone || null, email: fEmail || null, address: fAddress || null, status: "Active" };
    const { error: err } = editing
      ? await supabase.from("labs").update(payload).eq("id", editing.id)
      : await supabase.from("labs").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); reset(); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("labs").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Labs" subtitle="Manage external dental labs for prosthetics and appliances"
        rightSlot={<NewButton onClick={openAdd} label="+ Add Lab" />} />
      <STable loading={loading}
        columns={["Lab Name","Contact","Phone","Email","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.contact_name ?? "—", r.phone ?? "—", r.email ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title={editing ? "Edit Lab" : "Add Lab"} open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput label="Lab Name"      value={fName}    onChange={setFName}    required />
          <SInput label="Contact Name"  value={fContact} onChange={setFContact} />
          <div className="grid grid-cols-2 gap-3">
            <SInput label="Phone"       value={fPhone}   onChange={setFPhone} />
            <SInput label="Email"       value={fEmail}   onChange={setFEmail}   type="email" />
          </div>
          <SInput label="Address"       value={fAddress} onChange={setFAddress} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label={editing ? "UPDATE" : "CREATE"} />
            <ResetBtn onClick={reset} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Lab Categories ───────────────────────────────────────────────────────────

export function LabCategories() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("lab_categories").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("lab_categories").insert({ name: fName, status: "Active" });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("lab_categories").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Lab Categories" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Category" />} />
      <STable loading={loading}
        columns={["Category Name","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title="Add Lab Category" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput label="Category Name" value={fName} onChange={setFName} required placeholder="e.g. Crown, Denture, Orthodontic..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="CREATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Lab Pricing ──────────────────────────────────────────────────────────────

export function LabPricing() {
  const [rows, setRows] = useState([
    { work: "PFM Crown",         lab: "Dental Craft Lab",     price: 2500, turnaround: "5 days" },
    { work: "Zirconia Crown",    lab: "Dental Craft Lab",     price: 4500, turnaround: "7 days" },
    { work: "Metal Crown",       lab: "City Lab Works",       price: 1800, turnaround: "4 days" },
    { work: "Complete Denture",  lab: "City Lab Works",       price: 5000, turnaround: "10 days" },
    { work: "Partial Denture",   lab: "Advance Dental Lab",   price: 3500, turnaround: "7 days" },
    { work: "Night Guard",       lab: "Advance Dental Lab",   price: 1500, turnaround: "3 days" },
  ]);
  const [modal,  setModal]  = useState(false);
  const [fWork,  setFWork]  = useState("");
  const [fLab,   setFLab]   = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fDays,  setFDays]  = useState("");

  return (
    <div>
      <SPageHeader title="Lab Pricing" subtitle="Standard lab work prices and turnaround times"
        rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Entry" />} />
      <STable
        columns={["Lab Work","Lab Name","Price (₹)","Turnaround","Actions"]}
        rows={rows.map((r, i) => [
          <span className="font-medium">{r.work}</span>,
          r.lab,
          <span className="font-semibold text-[#1e2d5a]">₹{r.price.toLocaleString("en-IN")}</span>,
          r.turnaround,
          <button onClick={() => setRows(p => p.filter((_,j) => j!==i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Lab Pricing" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput label="Lab Work Description" value={fWork}  onChange={setFWork}  required placeholder="e.g. PFM Crown" />
          <SInput label="Lab Name"             value={fLab}   onChange={setFLab}   required />
          <div className="grid grid-cols-2 gap-3">
            <SInput label="Price (₹)"        value={fPrice} onChange={setFPrice} type="number" />
            <SInput label="Turnaround"       value={fDays}  onChange={setFDays}  placeholder="e.g. 5 days" />
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fWork && fLab) { setRows(p => [...p, { work: fWork, lab: fLab, price: Number(fPrice)||0, turnaround: fDays }]); setModal(false); setFWork(""); setFLab(""); setFPrice(""); setFDays(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
