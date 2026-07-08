import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Trash2, Plus, Upload } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// ─── DB hooks ─────────────────────────────────────────────────────────────────

export function useBranches() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase.from("branches").select("id, name").order("name").then(({ data }) => setBranches(data ?? []));
  }, []);
  return branches;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("id, name").then(({ data }) => setProfiles(data ?? []));
  }, []);
  return profiles;
}

export function useEquipmentList() {
  const [list, setList] = useState<{ id: string; name: string; equipment_code: string | null }[]>([]);
  useEffect(() => {
    supabase.from("equipment").select("id, name, equipment_code").eq("status", "Active").then(({ data }) => setList(data ?? []));
  }, []);
  return list;
}

export function useInventoryItems() {
  const [items, setItems] = useState<{ id: string; item_name: string; unit: string | null; current_stock: number }[]>([]);
  useEffect(() => {
    supabase.from("inventory_items").select("id, item_name, unit, current_stock").then(({ data }) => setItems(data ?? []));
  }, []);
  return items;
}

// re-export useAuth so screens can get created_by
export { useAuth };

// ─── Fallback constants (used when DB data not yet loaded) ────────────────────

export const PAYMENT_MODES = ["Cash", "Card", "Wallet", "Cheque/Online", "Others"];
export const DEPARTMENTS   = ["OPD", "Lab", "Reception", "Surgery", "Sterilization"];
export const LABS          = ["Select Lab", "DentaLab", "BrightSmile Lab", "Dental Pro Lab", "MaxiDent Labs"];
export const STATUSES      = ["Active", "Inactive"];
export const FREQ_OPTIONS  = ["Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly"];

// ─── Form primitives ──────────────────────────────────────────────────────────

export function ADropdown({ label, options, value, onChange, required = false, className = "" }: {
  label?: string; options: string[]; value: string;
  onChange: (v: string) => void; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 pr-8 outline-none focus:border-[#1e2d5a]">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function AInput({ label, value, onChange, required = false, placeholder = "", type = "text", className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
    </div>
  );
}

export function ADate({ label, value, onChange, required = false, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
    </div>
  );
}

export function ATextarea({ label, value, onChange, placeholder = "", rows = 3, className = "" }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs text-gray-500">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a] resize-none" />
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

export function PrimaryButton({ children, onClick, type = "button", className = "" }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string;
}) {
  return (
    <button type={type} onClick={onClick}
      className={`bg-[#1e2d5a] text-white rounded px-6 py-2 text-sm font-medium hover:bg-[#1a2650] transition-colors ${className}`}>
      {children}
    </button>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="border border-gray-300 text-gray-600 rounded px-6 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
      RESET
    </button>
  );
}

export function NewButton({ onClick, label = "New" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-2 text-sm hover:bg-[#1a2650]">
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function AdminTable({ columns, rows }: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col} className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-300 text-base">Looks like there's nothing to show here</p>
              </div>
            </td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingRows({ cols }: { cols: number }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

export function FilterBar({ children, onView, onReset, rightSlot }: {
  children: React.ReactNode; onView: () => void; onReset: () => void; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-end gap-3">
      {children}
      <div className="flex items-end gap-2 ml-1">
        <PrimaryButton onClick={onView}>View</PrimaryButton>
        <ResetButton onClick={onReset} />
      </div>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function PageHeader({ title, rightSlot }: { title: string; rightSlot?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-[#1e2d5a]">{title}</h2>
      {rightSlot}
    </div>
  );
}

export function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-gray-200 rounded-lg p-5">{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-700", Inactive: "bg-gray-100 text-gray-500",
    Pending: "bg-amber-100 text-amber-700", Completed: "bg-blue-100 text-blue-700",
    Resolved: "bg-teal-100 text-teal-700", Open: "bg-red-100 text-red-700",
    Given: "bg-purple-100 text-purple-700", Received: "bg-green-100 text-green-700",
    Success: "bg-green-100 text-green-700", Failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// ─── Inventory line items ─────────────────────────────────────────────────────

export interface LineItem {
  item_id: string; item_name: string; qty: number; price: number;
  disc: number; lastPrice: number; taxRate: number; notes: string;
  available_qty?: number; unit?: string;
}

export function calcLineItem(row: LineItem) {
  const gross   = row.qty * row.price;
  const discAmt = gross * (row.disc / 100);
  const net     = gross - discAmt;
  const taxAmt  = net * (row.taxRate / 100);
  return { gross, discAmt, net, taxAmt, total: net + taxAmt };
}

export function emptyLineItem(): LineItem {
  return { item_id: "", item_name: "", qty: 1, price: 0, disc: 0, lastPrice: 0, taxRate: 0, notes: "", available_qty: 0, unit: "Pcs" };
}

export function InventoryLineItems({ rows, onChange, onAdd, onRemove, mode = "purchase", inventoryItems }: {
  rows: LineItem[];
  onChange: (i: number, field: keyof LineItem, val: string | number) => void;
  onAdd: () => void; onRemove: (i: number) => void;
  mode?: "purchase" | "consume" | "transfer";
  inventoryItems: { id: string; item_name: string; unit: string | null; current_stock: number }[];
}) {
  const handleItemSelect = (i: number, itemId: string) => {
    const found = inventoryItems.find(it => it.id === itemId);
    if (found) {
      onChange(i, "item_id",        found.id);
      onChange(i, "item_name",      found.item_name);
      onChange(i, "available_qty",  found.current_stock);
      onChange(i, "unit",           found.unit ?? "Pcs");
    } else {
      onChange(i, "item_id", "");
      onChange(i, "item_name", "");
    }
  };

  return (
    <div className="mt-4">
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-600">
                <div className="flex items-center gap-1">
                  Item
                  <button onClick={onAdd} className="ml-1 w-4 h-4 bg-[#1e2d5a] text-white rounded-sm flex items-center justify-center">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </th>
              {mode === "purchase" && <><th className="px-3 py-2 text-left font-semibold text-gray-600">Last ₹</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Price</th></>}
              {mode === "purchase" && <><th className="px-3 py-2 text-left font-semibold text-gray-600">Qty</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Disc%</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Net</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Tax</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Total</th></>}
              {(mode === "consume" || mode === "transfer") && <><th className="px-3 py-2 text-left font-semibold text-gray-600">Avail</th><th className="px-3 py-2 text-left font-semibold text-gray-600">{mode === "consume" ? "Consume" : "Transfer"} Qty</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Unit</th></>}
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Notes</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-300">Add items using the + button above</td></tr>
            )}
            {rows.map((row, i) => {
              const calc = calcLineItem(row);
              return (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-2 py-1.5 min-w-[160px]">
                    <div className="relative">
                      <select value={row.item_id} onChange={e => handleItemSelect(i, e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded bg-white px-2 py-1 text-xs pr-6 outline-none focus:border-[#1e2d5a]">
                        <option value="">Select item</option>
                        {inventoryItems.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  {mode === "purchase" && <td className="px-2 py-1.5 text-gray-400">₹{row.lastPrice.toFixed(2)}</td>}
                  {mode === "purchase" && (
                    <td className="px-2 py-1.5 min-w-[70px]">
                      <input type="number" value={row.price} onChange={e => onChange(i, "price", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
                    </td>
                  )}
                  <td className="px-2 py-1.5 min-w-[60px]">
                    <input type="number" value={row.qty} onChange={e => onChange(i, "qty", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
                  </td>
                  {mode === "purchase" && (
                    <td className="px-2 py-1.5 min-w-[60px]">
                      <input type="number" value={row.disc} onChange={e => onChange(i, "disc", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
                    </td>
                  )}
                  {mode === "purchase" && <td className="px-2 py-1.5 text-gray-600">₹{calc.net.toFixed(2)}</td>}
                  {mode === "purchase" && <td className="px-2 py-1.5 text-gray-600">₹{calc.taxAmt.toFixed(2)}</td>}
                  {mode === "purchase" && <td className="px-2 py-1.5 font-medium">₹{calc.total.toFixed(2)}</td>}
                  {(mode === "consume" || mode === "transfer") && <td className="px-2 py-1.5 text-gray-500">{row.available_qty ?? "—"}</td>}
                  {(mode === "consume" || mode === "transfer") && (
                    <td className="px-2 py-1.5 min-w-[70px]">
                      <input type="number" value={row.qty} onChange={e => onChange(i, "qty", Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
                    </td>
                  )}
                  {(mode === "consume" || mode === "transfer") && <td className="px-2 py-1.5 text-gray-500">{row.unit ?? "Pcs"}</td>}
                  <td className="px-2 py-1.5 min-w-[100px]">
                    <input type="text" value={row.notes} onChange={e => onChange(i, "notes", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none" />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && mode === "purchase" && (
        <div className="mt-2 flex justify-end text-xs text-gray-600 gap-6 pr-8">
          <span>Net: <strong>₹{rows.reduce((s, r) => s + calcLineItem(r).net, 0).toFixed(2)}</strong></span>
          <span>Tax: <strong>₹{rows.reduce((s, r) => s + calcLineItem(r).taxAmt, 0).toFixed(2)}</strong></span>
          <span className="text-[#1e2d5a] font-bold">Total: ₹{rows.reduce((s, r) => s + calcLineItem(r).total, 0).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export function UploadBox() {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center gap-3 bg-gray-50">
      <Upload className="h-8 w-8 text-gray-300" />
      <button className="flex items-center gap-2 border border-gray-300 rounded px-4 py-2 text-sm text-gray-600 hover:bg-white">
        <Upload className="h-4 w-4" /> Upload your Files
      </button>
      <p className="text-xs text-gray-400">Maximum file size allowed is 3 MB</p>
    </div>
  );
}
