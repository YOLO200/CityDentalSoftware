import { useState, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, AInput, ATextarea, AdminTable, FilterBar, PageHeader,
  FormCard, PrimaryButton, ResetButton, StatusBadge, NewButton, UploadBox,
  fmtDate, LoadingRows, useBranches, useEquipmentList, useAuth,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];
const RESPONSIBLE_OPTIONS = ["Select Person", "Dr. Anand Jasani", "Dr. Priya Patel", "Lab Tech B", "Receptionist A", "Admin User"];

// ─── Generic NABH screen ──────────────────────────────────────────────────────

interface NabhConfig {
  title: string;
  table: string;
  columns: string[];
  mapRow: (r: any, branchMap: Record<string, string>) => (string | React.ReactNode)[];
  extraFields?: (state: any, set: any) => React.ReactNode;
  extraState?: Record<string, string>;
  buildInsert: (state: any, branchMap: Record<string, string>, userId: string | undefined) => Record<string, any>;
}

function NabhScreen({ cfg }: { cfg: NabhConfig }) {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // filter
  const [fBranch, setFBranch] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());
  const [fStatus, setFStatus] = useState("Active");

  // form
  const [fCenter, setFCenter]  = useState("");
  const [fDate,   setFDate]    = useState(today());
  const [fPerson, setFPerson]  = useState(RESPONSIBLE_OPTIONS[0]);
  const [fNotes,  setFNotes]   = useState("");
  const [fStatus2,setFStatus2] = useState("Active");
  const [extra,   setExtra]    = useState<Record<string, string>>(cfg.extraState ?? {});

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const setBranchMap = Object.fromEntries(branches.map(b => [b.id, b.name]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase.from(cfg.table) as any)
      .select("*, branches(name)")
      .order("created_at", { ascending: false });
    if (fFrom)   q = q.gte("date", fFrom);
    if (fTo)     q = q.lte("date", fTo);
    if (fStatus !== "All") q = q.eq("status", fStatus);
    if (fBranch !== "All Centers") {
      const bid = branchMap[fBranch];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({ ...r, branch_name: r.branches?.name ?? "—" })));
    setLoading(false);
  }, [fBranch, fFrom, fTo, fStatus, branches, cfg.table]);

  const save = async () => {
    setSaving(true); setError(null);
    const payload = cfg.buildInsert(
      { fCenter, fDate, fPerson, fNotes, fStatus2, ...extra },
      branchMap, user?.id
    );
    const { error: err } = await (supabase.from(cfg.table) as any).insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFCenter(""); setFDate(today()); setFPerson(RESPONSIBLE_OPTIONS[0]); setFNotes(""); setFStatus2("Active");
    setExtra(cfg.extraState ?? {});
    load();
  };

  const setExtraField = (key: string, val: string) => setExtra(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader title={cfg.title} rightSlot={<NewButton onClick={() => setShowForm(s => !s)} />} />

      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Center"             options={branches.map(b => b.name)} value={fCenter}  onChange={setFCenter} required />
            <ADate     label="Date"               value={fDate}   onChange={setFDate}   required />
            <ADropdown label="Responsible Person" options={RESPONSIBLE_OPTIONS}        value={fPerson}  onChange={setFPerson} />
            <ADropdown label="Status"             options={["Active","Inactive","Completed"]} value={fStatus2} onChange={setFStatus2} />
            {cfg.extraFields?.({ ...extra }, setExtraField)}
            <ATextarea label="Notes" value={fNotes} onChange={setFNotes} className="md:col-span-3" />
          </div>
          <div className="mt-4 mb-3"><UploadBox /></div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}

      <div className="mt-4">
        <FilterBar onView={load} onReset={() => { setFBranch("All Centers"); setFFrom(today()); setFTo(today()); setFStatus("Active"); setRows([]); }}>
          <ADropdown label="Center" options={branchNames}                  value={fBranch} onChange={setFBranch} className="w-44" />
          <ADate     label="From"   value={fFrom}                          onChange={setFFrom} />
          <ADate     label="To"     value={fTo}                            onChange={setFTo} />
          <ADropdown label="Status" options={["Active","Inactive","Completed","All"]} value={fStatus} onChange={setFStatus} className="w-32" />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={cfg.columns.length} /> : (
          <AdminTable columns={cfg.columns} rows={rows.map(r => cfg.mapRow(r, setBranchMap))} />
        )}
      </div>
    </div>
  );
}

// ─── Individual NABH screens ──────────────────────────────────────────────────

export function AboutNabh() {
  return (
    <div>
      <PageHeader title="About NABH" />
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-[#1e2d5a] text-base mb-2">National Accreditation Board for Hospitals & Healthcare Providers</h3>
        <p className="text-sm text-gray-600 mb-4">NABH is a constituent board of Quality Council of India (QCI), set up to establish and operate accreditation programmes for healthcare organizations.</p>
        <div className="grid grid-cols-2 gap-3">
          {["Biomedical Waste","Fumigation","Sterilization","Spore Test","Equipment Master","Equipment Maintenance","Equipment Breakdown"]
            .map(item => (
              <div key={item} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-[#1e2d5a] text-xs mb-1">{item}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function BiomedicalWaste() {
  return <NabhScreen cfg={{
    title: "Biomedical Waste", table: "biomedical_waste",
    columns: ["Date","Center","Waste Type","Qty (kg)","Disposed By","Status",""],
    extraState: { waste_type: "", quantity_kg: "", disposed_by: "" },
    extraFields: (s, set) => (<>
      <AInput label="Waste Type"    value={s.waste_type}   onChange={v => set("waste_type", v)}    placeholder="e.g. Yellow Bag" />
      <AInput label="Quantity (kg)" value={s.quantity_kg}  onChange={v => set("quantity_kg", v)}   type="number" />
      <AInput label="Disposed By"   value={s.disposed_by}  onChange={v => set("disposed_by", v)} />
    </>),
    mapRow: (r) => [fmtDate(r.date), r.branch_name, r.waste_type ?? "—", r.quantity_kg ?? "—", r.disposed_by ?? "—", <StatusBadge status={r.status} />, <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>],
    buildInsert: (s, bm, uid) => ({ created_by: uid, branch_id: bm[s.fCenter] ?? null, date: s.fDate, waste_type: s.waste_type || null, quantity_kg: s.quantity_kg ? Number(s.quantity_kg) : null, disposed_by: s.disposed_by || null, responsible_person: s.fPerson, notes: s.fNotes || null, status: s.fStatus2 }),
  }} />;
}

export function Fumigation() {
  return <NabhScreen cfg={{
    title: "Fumigation", table: "fumigation_records",
    columns: ["Date","Center","Area","Chemical","Next Due","Status",""],
    extraState: { area_covered: "", chemical_used: "", next_due_date: "" },
    extraFields: (s, set) => (<>
      <AInput label="Area Covered"   value={s.area_covered}  onChange={v => set("area_covered", v)}  placeholder="e.g. OPD Room" />
      <AInput label="Chemical Used"  value={s.chemical_used} onChange={v => set("chemical_used", v)} />
      <ADate  label="Next Due Date"  value={s.next_due_date} onChange={v => set("next_due_date", v)} />
    </>),
    mapRow: (r) => [fmtDate(r.date), r.branch_name, r.area_covered ?? "—", r.chemical_used ?? "—", fmtDate(r.next_due_date), <StatusBadge status={r.status} />, <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>],
    buildInsert: (s, bm, uid) => ({ created_by: uid, branch_id: bm[s.fCenter] ?? null, date: s.fDate, area_covered: s.area_covered || null, chemical_used: s.chemical_used || null, next_due_date: s.next_due_date || null, responsible_person: s.fPerson, notes: s.fNotes || null, status: s.fStatus2 }),
  }} />;
}

export function Sterilization() {
  return <NabhScreen cfg={{
    title: "Sterilization", table: "sterilization_records",
    columns: ["Date","Center","Instrument Set","Cycle No.","Method","Status",""],
    extraState: { instrument_set: "", cycle_number: "", method: "Autoclave" },
    extraFields: (s, set) => (<>
      <AInput    label="Instrument Set" value={s.instrument_set} onChange={v => set("instrument_set", v)} placeholder="e.g. Extraction Set" />
      <AInput    label="Cycle No."      value={s.cycle_number}   onChange={v => set("cycle_number", v)} />
      <ADropdown label="Method"         options={["Autoclave","Chemical","UV","Dry Heat"]} value={s.method} onChange={v => set("method", v)} />
    </>),
    mapRow: (r) => [fmtDate(r.date), r.branch_name, r.instrument_set ?? "—", r.cycle_number ?? "—", r.method ?? "—", <StatusBadge status={r.status} />, <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>],
    buildInsert: (s, bm, uid) => ({ created_by: uid, branch_id: bm[s.fCenter] ?? null, date: s.fDate, instrument_set: s.instrument_set || null, cycle_number: s.cycle_number || null, method: s.method, responsible_person: s.fPerson, notes: s.fNotes || null, status: s.fStatus2 }),
  }} />;
}

export function SporeTest() {
  return <NabhScreen cfg={{
    title: "Spore Test", table: "spore_tests",
    columns: ["Date","Center","Autoclave ID","Result","Status",""],
    extraState: { autoclave_id: "", result: "Negative (Pass)" },
    extraFields: (s, set) => (<>
      <AInput    label="Autoclave ID" value={s.autoclave_id} onChange={v => set("autoclave_id", v)} />
      <ADropdown label="Result"       options={["Negative (Pass)","Positive (Fail)"]} value={s.result} onChange={v => set("result", v)} />
    </>),
    mapRow: (r) => [fmtDate(r.date), r.branch_name, r.autoclave_id ?? "—", <span className={r.result?.includes("Pass") ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{r.result ?? "—"}</span>, <StatusBadge status={r.status} />, <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>],
    buildInsert: (s, bm, uid) => ({ created_by: uid, branch_id: bm[s.fCenter] ?? null, date: s.fDate, autoclave_id: s.autoclave_id || null, result: s.result, responsible_person: s.fPerson, notes: s.fNotes || null, status: s.fStatus2 }),
  }} />;
}

// ─── Equipment Master ─────────────────────────────────────────────────────────

export function EquipmentMaster() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fCode,     setFCode]     = useState("");
  const [fCategory, setFCategory] = useState("Diagnostic");
  const [fCenter,   setFCenter]   = useState("");
  const [fPurchase, setFPurchase] = useState(today());
  const [fWarranty, setFWarranty] = useState("");
  const [fVendor,   setFVendor]   = useState("");
  const [fStatus,   setFStatus]   = useState("Active");

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("equipment").select("*, branches(name)").order("created_at", { ascending: false });
    setRows((data ?? []).map((r: any) => ({ ...r, branch_name: r.branches?.name ?? "—" })));
    setLoading(false);
  }, []);

  const save = async () => {
    if (!fName) { setError("Equipment name is required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("equipment").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fCenter] ?? null,
      name: fName, equipment_code: fCode || null, category: fCategory,
      purchase_date: fPurchase || null, warranty_expiry: fWarranty || null,
      vendor: fVendor || null, status: fStatus,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFName(""); setFCode(""); setFCenter(""); setFPurchase(today()); setFWarranty(""); setFVendor("");
    load();
  };

  return (
    <div>
      <PageHeader title="Equipment Master" rightSlot={<NewButton onClick={() => { setShowForm(s => !s); if (!rows.length) load(); }} />} />
      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AInput    label="Equipment Name"  value={fName}     onChange={setFName}     required />
            <AInput    label="Equipment Code"  value={fCode}     onChange={setFCode} />
            <ADropdown label="Category"        options={["Diagnostic","Sterilization","Treatment","Infrastructure","Lab"]} value={fCategory} onChange={setFCategory} />
            <ADropdown label="Center"          options={branches.map(b=>b.name)} value={fCenter} onChange={setFCenter} />
            <ADate     label="Purchase Date"   value={fPurchase} onChange={setFPurchase} />
            <ADate     label="Warranty Expiry" value={fWarranty} onChange={setFWarranty} />
            <AInput    label="Vendor"          value={fVendor}   onChange={setFVendor} />
            <ADropdown label="Status"          options={["Active","Inactive"]} value={fStatus} onChange={setFStatus} />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}
      <div className="mt-4">
        {rows.length === 0 && !loading && (
          <div className="mb-3">
            <button onClick={load} className="text-xs text-[#1e2d5a] hover:underline">Load equipment list →</button>
          </div>
        )}
        {loading ? <LoadingRows cols={8} /> : (
          <AdminTable
            columns={["Name","Code","Category","Center","Purchase Date","Warranty","Vendor","Status",""]}
            rows={rows.map(r => [
              <span className="font-medium">{r.name}</span>,
              <span className="font-mono text-xs">{r.equipment_code ?? "—"}</span>,
              r.category ?? "—", r.branch_name,
              fmtDate(r.purchase_date), fmtDate(r.warranty_expiry),
              r.vendor ?? "—",
              <StatusBadge status={r.status} />,
              <button onClick={() => {}} className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-4 w-4" /></button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Equipment Maintenance ────────────────────────────────────────────────────

export function EquipmentMaintenance() {
  const { user }  = useAuth();
  const equipment = useEquipmentList();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fEquip,  setFEquip]  = useState("");
  const [fDate,   setFDate]   = useState(today());
  const [fNext,   setFNext]   = useState("");
  const [fTech,   setFTech]   = useState("");
  const [fCost,   setFCost]   = useState("");
  const [fNotes,  setFNotes]  = useState("");
  const [fStatus, setFStatus] = useState("Completed");
  const equipMap = Object.fromEntries(equipment.map(e => [e.id, e.name]));

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("equipment_maintenance")
      .select("*, equipment(name)")
      .order("maintenance_date", { ascending: false });
    setRows((data ?? []).map((r: any) => ({ ...r, equipment_name: r.equipment?.name ?? "—" })));
    setLoading(false);
  }, []);

  const save = async () => {
    if (!fEquip || !fDate) { setError("Equipment and date are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("equipment_maintenance").insert({
      created_by: user?.id ?? null, equipment_id: fEquip,
      maintenance_date: fDate, next_due_date: fNext || null,
      technician: fTech || null, cost: fCost ? Number(fCost) : null,
      notes: fNotes || null, status: fStatus,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFEquip(""); setFDate(today()); setFNext(""); setFTech(""); setFCost(""); setFNotes("");
    load();
  };

  return (
    <div>
      <PageHeader title="Equipment Maintenance" rightSlot={<NewButton onClick={() => { setShowForm(s => !s); if (!rows.length) load(); }} />} />
      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Equipment"        options={["Select Equipment", ...equipment.map(e => e.id)]} value={fEquip} onChange={setFEquip} required />
            <ADate     label="Maintenance Date" value={fDate}  onChange={setFDate}  required />
            <ADate     label="Next Due Date"    value={fNext}  onChange={setFNext} />
            <AInput    label="Technician"       value={fTech}  onChange={setFTech}  placeholder="Name or vendor" />
            <AInput    label="Cost (₹)"         value={fCost}  onChange={setFCost}  type="number" />
            <ADropdown label="Status"           options={["Completed","Pending","Scheduled"]} value={fStatus} onChange={setFStatus} />
            <ATextarea label="Notes"            value={fNotes} onChange={setFNotes} className="md:col-span-3" />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}
      <div className="mt-4">
        {rows.length === 0 && !loading && (
          <div className="mb-3"><button onClick={load} className="text-xs text-[#1e2d5a] hover:underline">Load maintenance records →</button></div>
        )}
        {loading ? <LoadingRows cols={7} /> : (
          <AdminTable
            columns={["Equipment","Date","Next Due","Technician","Cost","Status",""]}
            rows={rows.map(r => [
              <span className="font-medium">{r.equipment_name}</span>,
              fmtDate(r.maintenance_date), fmtDate(r.next_due_date),
              r.technician ?? "—",
              r.cost ? `₹${Number(r.cost).toLocaleString("en-IN")}` : "—",
              <StatusBadge status={r.status} />,
              <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Equipment Breakdown ──────────────────────────────────────────────────────

export function EquipmentBreakdown() {
  const { user }  = useAuth();
  const equipment = useEquipmentList();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fEquip,  setFEquip]  = useState("");
  const [fDate,   setFDate]   = useState(today());
  const [fIssue,  setFIssue]  = useState("");
  const [fTech,   setFTech]   = useState("");
  const [fResolution, setFResolution] = useState("");
  const [fStatus, setFStatus] = useState("Open");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("equipment_breakdown")
      .select("*, equipment(name)")
      .order("breakdown_date", { ascending: false });
    setRows((data ?? []).map((r: any) => ({ ...r, equipment_name: r.equipment?.name ?? "—" })));
    setLoading(false);
  }, []);

  const save = async () => {
    if (!fEquip || !fDate) { setError("Equipment and date are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("equipment_breakdown").insert({
      created_by: user?.id ?? null, equipment_id: fEquip,
      breakdown_date: fDate, issue_description: fIssue || null,
      assigned_technician: fTech || null, resolution_notes: fResolution || null, status: fStatus,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFEquip(""); setFDate(today()); setFIssue(""); setFTech(""); setFResolution("");
    load();
  };

  return (
    <div>
      <PageHeader title="Equipment Breakdown" rightSlot={<NewButton onClick={() => { setShowForm(s => !s); if (!rows.length) load(); }} />} />
      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Equipment"           options={["Select Equipment", ...equipment.map(e => e.id)]} value={fEquip} onChange={setFEquip} required />
            <ADate     label="Breakdown Date"      value={fDate}   onChange={setFDate}   required />
            <AInput    label="Assigned Technician" value={fTech}   onChange={setFTech} />
            <ADropdown label="Status"              options={["Open","In Progress","Resolved"]} value={fStatus} onChange={setFStatus} />
            <ATextarea label="Issue Description"   value={fIssue}  onChange={setFIssue}  className="md:col-span-3" placeholder="Describe the breakdown..." />
            <ATextarea label="Resolution Notes"    value={fResolution} onChange={setFResolution} className="md:col-span-3" />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}
      <div className="mt-4">
        {rows.length === 0 && !loading && (
          <div className="mb-3"><button onClick={load} className="text-xs text-[#1e2d5a] hover:underline">Load breakdown records →</button></div>
        )}
        {loading ? <LoadingRows cols={6} /> : (
          <AdminTable
            columns={["Equipment","Date","Issue","Technician","Status",""]}
            rows={rows.map(r => [
              <span className="font-medium">{r.equipment_name}</span>,
              fmtDate(r.breakdown_date),
              <span className="max-w-[200px] truncate block">{r.issue_description ?? "—"}</span>,
              r.assigned_technician ?? "—",
              <StatusBadge status={r.status} />,
              <button><MoreVertical className="h-4 w-4 text-gray-400" /></button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}
