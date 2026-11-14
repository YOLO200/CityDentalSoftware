import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, ATextarea, PageHeader, FormCard, PrimaryButton, ResetButton,
  InventoryLineItems, emptyLineItem, LineItem,
  useBranches, useInventoryItems, useAuth, DEPARTMENTS,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// ─── Inventory Purchase ───────────────────────────────────────────────────────

export function InventoryPurchase() {
  const { user }      = useAuth();
  const branches      = useBranches();
  const inventoryItems = useInventoryItems();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [center,    setCenter]    = useState("");
  const [entryDate, setEntryDate] = useState(today());
  const [vendor,    setVendor]    = useState("");
  const [billNo,    setBillNo]    = useState("");
  const [billDate,  setBillDate]  = useState(today());
  const [rows,      setRows]      = useState<LineItem[]>([emptyLineItem()]);

  const vendorOptions = ["Select Vendor", "Dental Supplies Co.", "MedEquip India", "Procter & Dental", "Sunrise Medical"];
  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const updateRow = (i: number, field: keyof LineItem, val: string | number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRow    = () => setRows(prev => [...prev, emptyLineItem()]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setCenter(""); setEntryDate(today()); setVendor(""); setBillNo(""); setBillDate(today());
    setRows([emptyLineItem()]); setError(null); setSuccess(false);
  };

  const save = useCallback(async () => {
    const validRows = rows.filter(r => r.item_id && r.qty > 0);
    if (!billNo || !vendor || vendor === "Select Vendor" || validRows.length === 0) {
      setError("Bill No., Vendor, and at least one item are required."); return;
    }
    setSaving(true); setError(null);
    const insertPromises = validRows.map(r =>
      supabase.from("inventory_transactions").insert({
        created_by: user?.id ?? null,
        branch_id: branchMap[center] ?? null,
        item_id: r.item_id,
        type: "Purchase",
        quantity: r.qty,
        unit_cost: r.price || null,
        vendor: vendor !== "Select Vendor" ? vendor : null,
        invoice_number: billNo,
        date: billDate,
        notes: `Entry date: ${entryDate}${r.notes ? ` | ${r.notes}` : ""}`,
      })
    );
    const results = await Promise.all(insertPromises);
    const err = results.find(r => r.error);
    if (err?.error) { setError(err.error.message); setSaving(false); return; }

    // update inventory_items current_stock
    await Promise.all(validRows.map(async r => {
      const item = inventoryItems.find(it => it.id === r.item_id);
      if (item) {
        await supabase.from("inventory_items")
          .update({ current_stock: item.current_stock + r.qty, updated_at: new Date().toISOString() })
          .eq("id", r.item_id);
      }
    }));

    setSaving(false); setSuccess(true);
    setTimeout(() => { reset(); }, 1500);
  }, [rows, billNo, vendor, billDate, entryDate, center, branchMap, inventoryItems, user]);

  return (
    <div>
      <PageHeader title="Inventory Purchase" />
      <FormCard>
        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Purchase saved successfully.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Center"          options={branches.map(b => b.name)} value={center}    onChange={setCenter}    required />
          <ADate     label="Bill Entry Date" value={entryDate}                   onChange={setEntryDate} />
          <ADropdown label="Vendor"          options={vendorOptions}             value={vendor}    onChange={setVendor}    required />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Bill No.<span className="text-red-500 ml-0.5">*</span></label>
            <input value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. INV-2026-001"
              className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
          </div>
          <ADate label="Bill Date" value={billDate} onChange={setBillDate} required />
        </div>
        <InventoryLineItems rows={rows} onChange={updateRow} onAdd={addRow} onRemove={removeRow} mode="purchase" inventoryItems={inventoryItems} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </FormCard>
    </div>
  );
}

// ─── Inventory Consume ────────────────────────────────────────────────────────

export function InventoryConsume() {
  const { user }       = useAuth();
  const branches       = useBranches();
  const inventoryItems = useInventoryItems();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [center, setCenter] = useState("");
  const [date,   setDate]   = useState(today());
  const [dept,   setDept]   = useState(DEPARTMENTS[0]);
  const [notes,  setNotes]  = useState("");
  const [rows,   setRows]   = useState<LineItem[]>([emptyLineItem()]);

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const updateRow = (i: number, field: keyof LineItem, val: string | number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRow    = () => setRows(prev => [...prev, emptyLineItem()]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const reset = () => { setCenter(""); setDate(today()); setDept(DEPARTMENTS[0]); setNotes(""); setRows([emptyLineItem()]); setError(null); setSuccess(false); };

  const save = useCallback(async () => {
    const validRows = rows.filter(r => r.item_id && r.qty > 0);
    if (validRows.length === 0) { setError("Add at least one item."); return; }
    setSaving(true); setError(null);
    const insertPromises = validRows.map(r =>
      supabase.from("inventory_transactions").insert({
        created_by: user?.id ?? null,
        branch_id: branchMap[center] ?? null,
        item_id: r.item_id,
        type: "Consumption",
        quantity: r.qty,
        date,
        notes: `Dept: ${dept}${r.notes ? ` | ${r.notes}` : ""}${notes ? ` | ${notes}` : ""}`,
      })
    );
    const results = await Promise.all(insertPromises);
    const err = results.find(r => r.error);
    if (err?.error) { setError(err.error.message); setSaving(false); return; }

    // deduct from current_stock
    await Promise.all(validRows.map(async r => {
      const item = inventoryItems.find(it => it.id === r.item_id);
      if (item) {
        await supabase.from("inventory_items")
          .update({ current_stock: Math.max(0, item.current_stock - r.qty), updated_at: new Date().toISOString() })
          .eq("id", r.item_id);
      }
    }));

    setSaving(false); setSuccess(true);
    setTimeout(() => { reset(); }, 1500);
  }, [rows, date, dept, notes, center, branchMap, inventoryItems, user]);

  return (
    <div>
      <PageHeader title="Inventory Consumption" />
      <FormCard>
        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Consumption recorded successfully.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Center"           options={branches.map(b => b.name)} value={center} onChange={setCenter} required />
          <ADate     label="Consumption Date" value={date}                        onChange={setDate}  required />
          <ADropdown label="Department"       options={DEPARTMENTS}               value={dept}   onChange={setDept} />
          <ATextarea label="Notes"            value={notes}                       onChange={setNotes} className="md:col-span-3" />
        </div>
        <InventoryLineItems rows={rows} onChange={updateRow} onAdd={addRow} onRemove={removeRow} mode="consume" inventoryItems={inventoryItems} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </FormCard>
    </div>
  );
}

// ─── Inventory Transfer ───────────────────────────────────────────────────────

export function InventoryTransfer() {
  const { user }       = useAuth();
  const branches       = useBranches();
  const inventoryItems = useInventoryItems();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fromCenter, setFromCenter] = useState("");
  const [toCenter,   setToCenter]   = useState("");
  const [date,       setDate]       = useState(today());
  const [notes,      setNotes]      = useState("");
  const [rows,       setRows]       = useState<LineItem[]>([emptyLineItem()]);

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const updateRow = (i: number, field: keyof LineItem, val: string | number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRow    = () => setRows(prev => [...prev, emptyLineItem()]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const reset = () => { setFromCenter(""); setToCenter(""); setDate(today()); setNotes(""); setRows([emptyLineItem()]); setError(null); setSuccess(false); };

  const save = useCallback(async () => {
    const validRows = rows.filter(r => r.item_id && r.qty > 0);
    if (!fromCenter || !toCenter || validRows.length === 0) {
      setError("From Center, To Center, and at least one item are required."); return;
    }
    if (fromCenter === toCenter) { setError("Transfer centers must be different."); return; }
    setSaving(true); setError(null);

    // Insert transfer header
    const { data: transfer, error: tErr } = await supabase.from("inventory_transfers").insert({
      created_by: user?.id ?? null,
      from_branch_id: branchMap[fromCenter] ?? null,
      to_branch_id:   branchMap[toCenter]   ?? null,
      transfer_date: date, notes: notes || null,
    }).select("id").single();

    if (tErr || !transfer) { setError(tErr?.message ?? "Failed to create transfer."); setSaving(false); return; }

    // Insert transfer items
    await supabase.from("inventory_transfer_items").insert(
      validRows.map(r => ({ transfer_id: transfer.id, item_id: r.item_id, quantity: r.qty, notes: r.notes || null }))
    );

    setSaving(false); setSuccess(true);
    setTimeout(() => { reset(); }, 1500);
  }, [rows, fromCenter, toCenter, date, notes, branchMap, user]);

  return (
    <div>
      <PageHeader title="Inventory Transfer" />
      <FormCard>
        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Transfer saved successfully.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Transfer From"  options={branches.map(b => b.name)} value={fromCenter} onChange={setFromCenter} required />
          <ADropdown label="Transfer To"    options={branches.map(b => b.name)} value={toCenter}   onChange={setToCenter}   required />
          <ADate     label="Transfer Date"  value={date}                        onChange={setDate}  required />
          <ATextarea label="Notes"          value={notes}                       onChange={setNotes} className="md:col-span-3" />
        </div>
        <InventoryLineItems rows={rows} onChange={updateRow} onAdd={addRow} onRemove={removeRow} mode="transfer" inventoryItems={inventoryItems} />
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </FormCard>
    </div>
  );
}
