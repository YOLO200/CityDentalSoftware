import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, STable, SModal,
  SBadge, SActionRow, NewButton, SaveButton, ResetBtn,
} from "./primitives";

// ─── Inventory Categories ─────────────────────────────────────────────────────

export function InventoryCategories() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fName,   setFName]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("inventory_categories").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!fName) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("inventory_categories").insert({ name: fName, status: "Active" });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); setFName(""); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("inventory_categories").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Inventory Categories" rightSlot={<NewButton onClick={() => { setError(null); setModal(true); }} label="+ Add Category" />} />
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
      <SModal title="Add Category" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput label="Category Name" value={fName} onChange={setFName} required placeholder="e.g. Disposables, Medicines..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label="CREATE" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export function Vendors() {
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
  const [fGST,     setFGST]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vendors").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setFName(""); setFContact(""); setFPhone(""); setFEmail(""); setFAddress(""); setFGST(""); setError(null); };

  const openAdd  = () => { setEditing(null); reset(); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setFName(r.name); setFContact(r.contact_name ?? ""); setFPhone(r.phone ?? ""); setFEmail(r.email ?? ""); setFAddress(r.address ?? ""); setFGST(r.gst_number ?? ""); setError(null); setModal(true); };

  const save = async () => {
    if (!fName) { setError("Vendor name is required."); return; }
    setSaving(true); setError(null);
    const payload = { name: fName, contact_name: fContact || null, phone: fPhone || null, email: fEmail || null, address: fAddress || null, gst_number: fGST || null, status: "Active" };
    const { error: err } = editing
      ? await supabase.from("vendors").update(payload).eq("id", editing.id)
      : await supabase.from("vendors").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); reset(); load();
  };

  const toggle = async (id: string, current: string) => {
    await supabase.from("vendors").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Vendors" rightSlot={<NewButton onClick={openAdd} label="+ Add Vendor" />} />
      <STable loading={loading}
        columns={["Vendor Name","Contact","Phone","GST Number","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.contact_name ?? "—", r.phone ?? "—", r.gst_number ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => toggle(r.id, r.status ?? "Active")}
              className="text-[10px] border border-amber-200 text-amber-600 rounded px-2 py-0.5 hover:bg-amber-50">Toggle</button>
          </div>,
        ])}
      />
      <SModal title={editing ? "Edit Vendor" : "Add Vendor"} open={modal} onClose={() => setModal(false)} width="max-w-xl">
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput label="Vendor Name"     value={fName}    onChange={setFName}    required />
          <SInput label="Contact Person"  value={fContact} onChange={setFContact} />
          <div className="grid grid-cols-2 gap-3">
            <SInput label="Phone"         value={fPhone}   onChange={setFPhone} />
            <SInput label="Email"         value={fEmail}   onChange={setFEmail}   type="email" />
          </div>
          <SInput label="GST Number"      value={fGST}     onChange={setFGST} />
          <SInput label="Address"         value={fAddress} onChange={setFAddress} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label={editing ? "UPDATE" : "CREATE"} />
            <ResetBtn onClick={reset} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Units ────────────────────────────────────────────────────────────────────

export function Units() {
  const [rows,  setRows]  = useState(["Box","Pack","Strip","Bottle","Piece","Pair","Roll","Litre","Kg","Gram","ml"].map(n => ({ name: n, status: "Active" })));
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");

  return (
    <div>
      <SPageHeader title="Units of Measurement" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Unit" />} />
      <STable
        columns={["Unit Name","Status","Actions"]}
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
      <SModal title="Add Unit" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput label="Unit Name" value={fName} onChange={setFName} required placeholder="e.g. Box, Strip, ml..." />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setRows(p => [...p, { name: fName, status: "Active" }]); setModal(false); setFName(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Stock Thresholds ─────────────────────────────────────────────────────────

export function StockThresholds() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("inventory_items")
      .select("id, item_name, current_stock, reorder_level, unit")
      .order("item_name");
    setRows(data ?? []);
    setLoading(false);
  };

  const updateThreshold = async (id: string, val: string) => {
    const level = Number(val);
    setRows(prev => prev.map(r => r.id === id ? { ...r, reorder_level: level } : r));
    await supabase.from("inventory_items").update({ reorder_level: level }).eq("id", id);
  };

  return (
    <div>
      <SPageHeader title="Stock Thresholds" subtitle="Set reorder levels for each inventory item" />
      <div className="mb-3"><button onClick={load} className="bg-[#1e2d5a] text-white rounded-lg px-4 py-2 text-xs font-semibold">{loading ? "Loading..." : "Load Items"}</button></div>
      <STable loading={loading}
        columns={["Item Name","Current Stock","Unit","Reorder Level","Status"]}
        rows={rows.map(r => {
          const isLow = Number(r.current_stock) <= Number(r.reorder_level ?? 0);
          return [
            <span className="font-medium">{r.item_name}</span>,
            <span className={isLow ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>{r.current_stock ?? 0}</span>,
            r.unit ?? "—",
            <input type="number" defaultValue={r.reorder_level ?? 0} onBlur={e => updateThreshold(r.id, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs w-20 outline-none focus:border-[#1e2d5a]" />,
            isLow
              ? <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Low Stock</span>
              : <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">OK</span>,
          ];
        })}
      />
    </div>
  );
}
