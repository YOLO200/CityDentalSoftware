import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, AInput, ATextarea, AdminTable, FilterBar, PageHeader,
  FormCard, PrimaryButton, ResetButton, StatusBadge, NewButton,
  fmtDate, fmtCurrency, LoadingRows, useBranches, useAuth, PAYMENT_MODES,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// shared patient search: returns [{id, label}]
async function searchPatients(q: string) {
  const { data } = await supabase.from("patients")
    .select("id, first_name, last_name, phone")
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);
  return (data ?? []).map((p: any) => ({ id: p.id, label: `${p.first_name} ${p.last_name} (${p.phone})` }));
}

// ─── Credit Notes ─────────────────────────────────────────────────────────────

export function CreditNotes() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fCenter, setFCenter] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  const [fPatient,setFPatient]= useState("");
  const [fNoteNo, setFNoteNo] = useState("");
  const [fDate,   setFDate]   = useState(today());
  const [fAmount, setFAmount] = useState("");
  const [fReason, setFReason] = useState("");
  const [fBranch, setFBranch] = useState("");

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("credit_notes")
      .select("*, patients(first_name, last_name), branches(name)")
      .order("date", { ascending: false });
    if (fFrom) q = q.gte("date", fFrom);
    if (fTo)   q = q.lte("date", fTo);
    if (fCenter !== "All Centers") {
      const bid = branchMap[fCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({
      ...r,
      patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—",
      branch_name: r.branches?.name ?? "—",
    })));
    setLoading(false);
  }, [fCenter, fFrom, fTo, branches]);

  const save = async () => {
    if (!fNoteNo || !fAmount || !fDate) { setError("Note #, Amount, and Date are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("credit_notes").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fBranch] ?? null,
      note_number: fNoteNo, date: fDate, amount: Number(fAmount),
      reason: fReason || null, status: "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFNoteNo(""); setFAmount(""); setFReason(""); setFPatient("");
    load();
  };

  return (
    <div>
      <PageHeader title="Credit Notes" rightSlot={<NewButton onClick={() => setShowForm(s => !s)} />} />
      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Center"     options={branches.map(b => b.name)} value={fBranch}  onChange={setFBranch} />
            <ADate     label="Date"       value={fDate}   onChange={setFDate}   required />
            <AInput    label="Patient"    value={fPatient} onChange={setFPatient} placeholder="Patient name or phone..." />
            <AInput    label="Note #"     value={fNoteNo} onChange={setFNoteNo} required placeholder="e.g. CN-001" />
            <AInput    label="Amount (₹)" value={fAmount} onChange={setFAmount} type="number" required />
            <AInput    label="Reason"     value={fReason} onChange={setFReason} className="md:col-span-3" />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}
      <div className="mt-4">
        <FilterBar onView={load} onReset={() => { setFCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
          <ADropdown label="Center" options={branchNames} value={fCenter} onChange={setFCenter} className="w-44" />
          <ADate label="From" value={fFrom} onChange={setFFrom} />
          <ADate label="To"   value={fTo}   onChange={setFTo} />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={6} /> : (
          <AdminTable
            columns={["Note #","Date","Patient","Amount","Reason","Status"]}
            rows={rows.map(r => [
              <span className="font-mono text-xs">{r.note_number}</span>,
              fmtDate(r.date),
              <span className="text-blue-600 font-medium">{r.patient_name}</span>,
              <span className="font-semibold">{fmtCurrency(r.amount)}</span>,
              <span className="italic text-gray-500">{r.reason ?? "—"}</span>,
              <StatusBadge status={r.status} />,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export function Settlements() {
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fCenter, setFCenter] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("receipts")
      .select("*, patients(first_name, last_name)")
      .eq("type", "Receipt").eq("status", "Regular")
      .order("date", { ascending: false });
    if (fFrom) q = q.gte("date", fFrom);
    if (fTo)   q = q.lte("date", fTo);
    if (fCenter !== "All Centers") {
      const bid = branchMap[fCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({
      ...r,
      patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—",
    })));
    setLoading(false);
  }, [fCenter, fFrom, fTo, branches]);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader title="Settlements" />
      <FilterBar onView={load} onReset={() => { setFCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
        <ADropdown label="Center" options={branchNames} value={fCenter} onChange={setFCenter} className="w-44" />
        <ADate label="From" value={fFrom} onChange={setFFrom} />
        <ADate label="To"   value={fTo}   onChange={setFTo} />
      </FilterBar>
      <div className="mt-4">
        {loading ? <LoadingRows cols={5} /> : (
          <AdminTable
            columns={["Receipt #","Date","Patient","Amount","Mode"]}
            rows={rows.map(r => [
              <span className="font-mono text-xs">{r.receipt_number}</span>,
              fmtDate(r.date),
              <span className="text-blue-600 font-medium">{r.patient_name}</span>,
              <span className="font-semibold">{fmtCurrency(Number(r.amount))}</span>,
              r.paid_by,
            ])}
          />
        )}
        {rows.length > 0 && (
          <div className="mt-2 flex justify-end text-xs text-gray-600">
            <span>Total Settled: <strong>{fmtCurrency(total)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payment Receive ──────────────────────────────────────────────────────────

export function PaymentReceive() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fCenter,  setFCenter]  = useState("");
  const [fDate,    setFDate]    = useState(today());
  const [fPatient, setFPatient] = useState("");
  const [fAmount,  setFAmount]  = useState("");
  const [fMode,    setFMode]    = useState("Cash");
  const [fRef,     setFRef]     = useState("");
  const [fNotes,   setFNotes]   = useState("");

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const reset = () => { setFCenter(""); setFDate(today()); setFPatient(""); setFAmount(""); setFMode("Cash"); setFRef(""); setFNotes(""); setError(null); setSuccess(false); };

  const save = async () => {
    if (!fAmount || !fDate) { setError("Amount and Date are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("receipts").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fCenter] ?? null,
      receipt_number: `RC-${Date.now().toString().slice(-6)}`,
      type: "Receipt", date: fDate, amount: Number(fAmount),
      paid_by: fMode, notes: (fRef ? `Ref: ${fRef}. ` : "") + (fNotes ?? ""),
      status: "Regular",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setSuccess(true); reset();
  };

  return (
    <div>
      <PageHeader title="Payment Receive" />
      <FormCard>
        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Payment recorded successfully.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Center"         options={branches.map(b=>b.name)} value={fCenter}  onChange={setFCenter} />
          <ADate     label="Date"           value={fDate}    onChange={setFDate}    required />
          <AInput    label="Patient"        value={fPatient} onChange={setFPatient} placeholder="Patient name or phone..." />
          <AInput    label="Amount (₹)"     value={fAmount}  onChange={setFAmount}  type="number" required />
          <ADropdown label="Payment Mode"   options={PAYMENT_MODES} value={fMode} onChange={setFMode} />
          <AInput    label="Reference #"    value={fRef}     onChange={setFRef}     placeholder="e.g. RC-1842" />
          <ATextarea label="Notes"          value={fNotes}   onChange={setFNotes}   className="md:col-span-3" />
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </FormCard>
    </div>
  );
}

// ─── Payment Gateway Transactions ─────────────────────────────────────────────

export function PaymentGatewayTransactions() {
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fCenter, setFCenter] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("payment_gateway_transactions")
      .select("*, patients(first_name, last_name)")
      .order("created_at", { ascending: false });
    if (fFrom) q = q.gte("created_at", fFrom + "T00:00:00");
    if (fTo)   q = q.lte("created_at", fTo   + "T23:59:59");
    if (fCenter !== "All Centers") {
      const bid = branchMap[fCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({
      ...r,
      patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—",
    })));
    setLoading(false);
  }, [fCenter, fFrom, fTo, branches]);

  return (
    <div>
      <PageHeader title="Payment Gateway Transactions" />
      <FilterBar onView={load} onReset={() => { setFCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
        <ADropdown label="Center" options={branchNames} value={fCenter} onChange={setFCenter} className="w-44" />
        <ADate label="From" value={fFrom} onChange={setFFrom} />
        <ADate label="To"   value={fTo}   onChange={setFTo} />
      </FilterBar>
      <div className="mt-4">
        {loading ? <LoadingRows cols={6} /> : (
          <AdminTable
            columns={["Txn ID","Date","Patient","Gateway","Amount","Status"]}
            rows={rows.map(r => [
              <span className="font-mono text-xs text-[#1e2d5a]">{r.transaction_id}</span>,
              <span className="font-mono text-[10px]">{new Date(r.created_at).toLocaleString("en-GB")}</span>,
              <span className="text-blue-600 font-medium">{r.patient_name}</span>,
              r.gateway,
              <span className="font-semibold">{fmtCurrency(Number(r.amount))}</span>,
              <StatusBadge status={r.status} />,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Payment Made ─────────────────────────────────────────────────────────────

export function PaymentMade() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fCenter,  setFCenter]  = useState("");
  const [fDate,    setFDate]    = useState(today());
  const [fVendor,  setFVendor]  = useState("");
  const [fAmount,  setFAmount]  = useState("");
  const [fMode,    setFMode]    = useState("Cash");
  const [fRef,     setFRef]     = useState("");
  const [fNotes,   setFNotes]   = useState("");

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const reset = () => { setFCenter(""); setFDate(today()); setFVendor(""); setFAmount(""); setFMode("Cash"); setFRef(""); setFNotes(""); setError(null); setSuccess(false); };

  const save = async () => {
    if (!fVendor || !fAmount) { setError("Vendor and Amount are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("expenses").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fCenter] ?? null,
      date: fDate, category: "Payment Made", vendor: fVendor,
      description: fRef ? `Ref: ${fRef}` : null,
      amount: Number(fAmount), paid_by: fMode, reference: fRef || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setSuccess(true); reset();
  };

  return (
    <div>
      <PageHeader title="Payment Made" />
      <FormCard>
        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Payment recorded.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Center"       options={branches.map(b=>b.name)} value={fCenter}  onChange={setFCenter} />
          <ADate     label="Date"         value={fDate}    onChange={setFDate}    required />
          <AInput    label="Vendor/Payee" value={fVendor}  onChange={setFVendor}  required placeholder="Vendor or payee name" />
          <AInput    label="Amount (₹)"   value={fAmount}  onChange={setFAmount}  type="number" required />
          <ADropdown label="Payment Mode" options={PAYMENT_MODES} value={fMode} onChange={setFMode} />
          <AInput    label="Reference #"  value={fRef}     onChange={setFRef} />
          <ATextarea label="Notes"        value={fNotes}   onChange={setFNotes}   className="md:col-span-3" />
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </FormCard>
    </div>
  );
}

// ─── Cash / Bank ──────────────────────────────────────────────────────────────

export function CashBank() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fCenter, setFCenter] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  const [fBranch,  setFBranch]  = useState("");
  const [fDate,    setFDate]    = useState(today());
  const [fType,    setFType]    = useState("Cash In");
  const [fAmount,  setFAmount]  = useState("");
  const [fDesc,    setFDesc]    = useState("");
  const [fRef,     setFRef]     = useState("");

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("cash_bank_entries")
      .select("*, branches(name)")
      .order("date", { ascending: false });
    if (fFrom) q = q.gte("date", fFrom);
    if (fTo)   q = q.lte("date", fTo);
    if (fCenter !== "All Centers") {
      const bid = branchMap[fCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [fCenter, fFrom, fTo, branches]);

  const save = async () => {
    if (!fAmount) return;
    setSaving(true);
    await supabase.from("cash_bank_entries").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fBranch] ?? null,
      date: fDate, type: fType, amount: Number(fAmount),
      description: fDesc || null, reference: fRef || null,
    });
    setSaving(false); setShowForm(false);
    setFDate(today()); setFAmount(""); setFDesc(""); setFRef("");
    load();
  };

  const running = () => {
    let bal = 0;
    return rows.map(r => {
      bal += r.type.includes("In") ? Number(r.amount) : -Number(r.amount);
      return bal;
    });
  };
  const balances = running();

  return (
    <div>
      <PageHeader title="Cash / Bank" rightSlot={<button onClick={() => setShowForm(s=>!s)} className="flex items-center gap-1.5 bg-[#1e2d5a] text-white rounded px-4 py-2 text-sm hover:bg-[#1a2650]">+ Entry</button>} />
      {showForm && (
        <FormCard>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Center"       options={branches.map(b=>b.name)} value={fBranch} onChange={setFBranch} />
            <ADate     label="Date"         value={fDate}   onChange={setFDate}   required />
            <ADropdown label="Type"         options={["Cash In","Cash Out","Bank In","Bank Out"]} value={fType} onChange={setFType} />
            <AInput    label="Amount (₹)"   value={fAmount} onChange={setFAmount} type="number" required />
            <AInput    label="Description"  value={fDesc}   onChange={setFDesc}   placeholder="e.g. Day receipts" />
            <AInput    label="Reference"    value={fRef}    onChange={setFRef} />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}
      <div className="mt-4">
        <FilterBar onView={load} onReset={() => { setFCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
          <ADropdown label="Center" options={branchNames} value={fCenter} onChange={setFCenter} className="w-44" />
          <ADate label="From" value={fFrom} onChange={setFFrom} />
          <ADate label="To"   value={fTo}   onChange={setFTo} />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={5} /> : (
          <AdminTable
            columns={["Date","Type","Amount","Description","Balance"]}
            rows={rows.map((r, i) => [
              fmtDate(r.date),
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.type.includes("In") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.type}</span>,
              <span className={`font-semibold ${r.type.includes("In") ? "text-green-700" : "text-red-600"}`}>{fmtCurrency(Number(r.amount))}</span>,
              r.description ?? "—",
              <span className="font-semibold text-[#1e2d5a]">{fmtCurrency(balances[i])}</span>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export function Journal() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fCenter, setFCenter] = useState("All Centers");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  const [fBranch,  setFBranch]  = useState("");
  const [fDate,    setFDate]    = useState(today());
  const [fDebit,   setFDebit]   = useState("");
  const [fCredit,  setFCredit]  = useState("");
  const [fAmount,  setFAmount]  = useState("");
  const [fNarr,    setFNarr]    = useState("");

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("journal_entries").select("*").order("date", { ascending: false });
    if (fFrom) q = q.gte("date", fFrom);
    if (fTo)   q = q.lte("date", fTo);
    if (fCenter !== "All Centers") {
      const bid = branchMap[fCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [fCenter, fFrom, fTo, branches]);

  const save = async () => {
    if (!fDebit || !fCredit || !fAmount) return;
    setSaving(true);
    await supabase.from("journal_entries").insert({
      created_by: user?.id ?? null, branch_id: branchMap[fBranch] ?? null,
      date: fDate, debit_account: fDebit, credit_account: fCredit,
      amount: Number(fAmount), narration: fNarr || null,
    });
    setSaving(false);
    setFDebit(""); setFCredit(""); setFAmount(""); setFNarr("");
    load();
  };

  return (
    <div>
      <PageHeader title="Journal" />
      <FormCard>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ADropdown label="Center"         options={branches.map(b=>b.name)} value={fBranch} onChange={setFBranch} />
          <ADate     label="Date"           value={fDate}   onChange={setFDate}   required />
          <AInput    label="Debit Account"  value={fDebit}  onChange={setFDebit}  required placeholder="e.g. Cash Account" />
          <AInput    label="Credit Account" value={fCredit} onChange={setFCredit} required placeholder="e.g. Revenue Account" />
          <AInput    label="Amount (₹)"     value={fAmount} onChange={setFAmount} type="number" required />
          <ATextarea label="Narration"      value={fNarr}   onChange={setFNarr}   className="md:col-span-3" />
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={() => { setFDebit(""); setFCredit(""); setFAmount(""); setFNarr(""); }} />
        </div>
      </FormCard>
      <div className="mt-4">
        <FilterBar onView={load} onReset={() => { setFCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
          <ADropdown label="Center" options={branchNames} value={fCenter} onChange={setFCenter} className="w-44" />
          <ADate label="From" value={fFrom} onChange={setFFrom} />
          <ADate label="To"   value={fTo}   onChange={setFTo} />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={5} /> : (
          <AdminTable
            columns={["Date","Debit Account","Credit Account","Amount","Narration"]}
            rows={rows.map(r => [
              fmtDate(r.date),
              <span className="font-medium">{r.debit_account}</span>,
              r.credit_account,
              <span className="font-semibold">{fmtCurrency(Number(r.amount))}</span>,
              <span className="italic text-gray-500">{r.narration ?? "—"}</span>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Opening Balances ─────────────────────────────────────────────────────────

const ACCOUNTS = ["Cash Account","Bank Account","Receivables","Payables","Equity","Other Income","Other Expense"];

export function OpeningBalances() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [entries, setEntries] = useState(ACCOUNTS.map(a => ({ account: a, debit: "", credit: "" })));
  const [fYear,   setFYear]   = useState("2026-2027");
  const [fDate,   setFDate]   = useState(today());
  const [fBranch, setFBranch] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const update = (i: number, field: "debit" | "credit", val: string) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const save = async () => {
    setSaving(true); setSuccess(false);
    const rows = entries.filter(e => Number(e.debit) > 0 || Number(e.credit) > 0).map(e => ({
      created_by: user?.id ?? null, branch_id: branchMap[fBranch] ?? null,
      financial_year: fYear, as_on_date: fDate,
      account_name: e.account, debit: Number(e.debit) || 0, credit: Number(e.credit) || 0,
    }));
    if (rows.length) await supabase.from("opening_balances").upsert(rows, { onConflict: "branch_id,financial_year,account_name" });
    setSaving(false); setSuccess(true);
  };

  return (
    <div>
      <PageHeader title="Opening Balances" />
      <FormCard>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <ADropdown label="Center"          options={branches.map(b=>b.name)} value={fBranch} onChange={setFBranch} />
          <ADropdown label="Financial Year"  options={["2024-2025","2025-2026","2026-2027"]} value={fYear} onChange={setFYear} />
          <ADate     label="As on Date"      value={fDate} onChange={setFDate} required />
        </div>
        {success && <p className="text-xs text-green-600 mb-2">Saved successfully.</p>}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Account</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Debit (₹)</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.account} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{e.account}</td>
                  <td className="px-4 py-2.5">
                    <input type="number" value={e.debit} onChange={ev => update(i, "debit", ev.target.value)} placeholder="0.00"
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-32 outline-none focus:border-[#1e2d5a]" />
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="number" value={e.credit} onChange={ev => update(i, "credit", ev.target.value)} placeholder="0.00"
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-32 outline-none focus:border-[#1e2d5a]" />
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-xs text-gray-600">Total</td>
                <td className="px-4 py-2.5 text-xs">₹{entries.reduce((s,e)=>s+(Number(e.debit)||0),0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                <td className="px-4 py-2.5 text-xs">₹{entries.reduce((s,e)=>s+(Number(e.credit)||0),0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
          <ResetButton onClick={() => setEntries(ACCOUNTS.map(a=>({account:a,debit:"",credit:""})))} />
        </div>
      </FormCard>
    </div>
  );
}
