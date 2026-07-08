import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, AInput, AdminTable, FilterBar, PageHeader,
  FormCard, PrimaryButton, ResetButton, StatusBadge, NewButton, UploadBox,
  fmtDate, LoadingRows, useBranches, useAuth, LABS,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// ─── Lab Bill ─────────────────────────────────────────────────────────────────

export function LabBill() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fCenter,    setFCenter]    = useState("");
  const [fLab,       setFLab]       = useState(LABS[0]);
  const [fEntryDate, setFEntryDate] = useState(today());
  const [fBillNo,    setFBillNo]    = useState("");
  const [fBillDate,  setFBillDate]  = useState(today());
  const [fAmount,    setFAmount]    = useState("");

  const [fFilterCenter, setFFilterCenter] = useState("All Centers");
  const [fFrom,         setFFrom]         = useState(today());
  const [fTo,           setFTo]           = useState(today());

  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const branchMap   = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const labOptions  = LABS.filter(l => l !== "Select Lab");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("lab_bills")
      .select("*, branches(name)")
      .order("entry_date", { ascending: false });
    if (fFrom) q = q.gte("entry_date", fFrom);
    if (fTo)   q = q.lte("entry_date", fTo);
    if (fFilterCenter !== "All Centers") {
      const bid = branchMap[fFilterCenter];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({ ...r, branch_name: r.branches?.name ?? "—" })));
    setLoading(false);
  }, [fFilterCenter, fFrom, fTo, branches]);

  const save = async () => {
    if (!fBillNo || !fLab || fLab === "Select Lab") { setError("Lab and Bill No. are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("lab_bills").insert({
      created_by: user?.id ?? null,
      branch_id: branchMap[fCenter] ?? null,
      lab_name: fLab, bill_number: fBillNo, bill_date: fBillDate,
      entry_date: fEntryDate,
      amount: fAmount ? Number(fAmount) : null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setSuccess(true); setShowForm(false);
    setFBillNo(""); setFAmount(""); setFCenter(""); setFLab(LABS[0]);
    setFEntryDate(today()); setFBillDate(today());
    load();
  };

  return (
    <div>
      <PageHeader title="Lab Bill" rightSlot={<NewButton onClick={() => setShowForm(s => !s)} />} />

      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Center"         options={branches.map(b => b.name)} value={fCenter}    onChange={setFCenter} />
            <ADropdown label="Lab"            options={labOptions}                value={fLab}       onChange={setFLab}       required />
            <ADate     label="Bill Entry Date"value={fEntryDate}                  onChange={setFEntryDate} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Bill No.<span className="text-red-500 ml-0.5">*</span></label>
              <input value={fBillNo} onChange={e => setFBillNo(e.target.value)} placeholder="e.g. LAB-2026-101"
                className="border border-gray-300 rounded bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
            </div>
            <ADate  label="Bill Date"   value={fBillDate} onChange={setFBillDate} required />
            <AInput label="Amount (₹)"  value={fAmount}   onChange={setFAmount}   type="number" />
          </div>
          <div className="mt-4 mb-3"><UploadBox /></div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}

      <div className="mt-4">
        <FilterBar onView={load} onReset={() => { setFFilterCenter("All Centers"); setFFrom(today()); setFTo(today()); setRows([]); }}>
          <ADropdown label="Center" options={branchNames} value={fFilterCenter} onChange={setFFilterCenter} className="w-44" />
          <ADate label="From" value={fFrom} onChange={setFFrom} />
          <ADate label="To"   value={fTo}   onChange={setFTo} />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={6} /> : (
          <AdminTable
            columns={["Entry Date","Bill Date","Lab","Bill No.","Center","Amount",""]}
            rows={rows.map(r => [
              fmtDate(r.entry_date), fmtDate(r.bill_date),
              <span className="font-medium text-[#1e2d5a]">{r.lab_name}</span>,
              <span className="font-mono text-xs">{r.bill_number}</span>,
              r.branch_name,
              r.amount ? `₹${Number(r.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—",
              <button className="text-gray-400 hover:text-gray-700">⋮</button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Give & Receive Lab Work ──────────────────────────────────────────────────

export function GiveReceiveLabWork() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [tab,     setTab]     = useState<"give" | "receive">("give");
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fCenter, setFCenter] = useState("");
  const [fLab,    setFLab]    = useState(LABS[0]);
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());

  // Give form
  const [gPerson,  setGPerson]  = useState("");
  const [gItems,   setGItems]   = useState([{ patient: "", work: "", notes: "" }]);

  // Receive form
  const [rPerson,  setRPerson]  = useState("");
  const [rItems,   setRItems]   = useState<any[]>([]);

  const branchMap = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const branchNames = ["All Centers", ...branches.map(b => b.name)];
  const labOptions  = LABS.filter(l => l !== "Select Lab");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("lab_work")
      .select("*, patients(first_name, last_name)")
      .order("created_at", { ascending: false });
    if (fFrom) q = q.gte("created_at", fFrom + "T00:00:00");
    if (fTo)   q = q.lte("created_at", fTo   + "T23:59:59");
    if (fLab && fLab !== "Select Lab") q = q.eq("lab_name", fLab);
    const { data } = await q;
    setRows((data ?? []).map((r: any) => ({
      ...r,
      patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—",
    })));
    setLoading(false);
  }, [fLab, fFrom, fTo]);

  const loadPendingReceive = useCallback(async () => {
    const { data } = await supabase.from("lab_work")
      .select("*, patients(first_name, last_name)")
      .eq("status", "Given")
      .eq("lab_name", fLab !== "Select Lab" ? fLab : "");
    setRItems((data ?? []).map((r: any) => ({
      ...r,
      patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—",
    })));
  }, [fLab]);

  const giveWork = async () => {
    const validItems = gItems.filter(i => i.work);
    if (!validItems.length || !fLab || fLab === "Select Lab") { setError("Lab and at least one work item are required."); return; }
    setSaving(true); setError(null);
    await Promise.all(validItems.map(item =>
      supabase.from("lab_work").insert({
        created_by: user?.id ?? null,
        branch_id: branchMap[fCenter] ?? null,
        lab_name: fLab,
        work_description: item.work,
        given_to: gPerson || null,
        given_date: today(),
        status: "Given",
        notes: item.notes || null,
      })
    ));
    setSaving(false); setSuccess(true);
    setGPerson(""); setGItems([{ patient: "", work: "", notes: "" }]);
    setTimeout(() => setSuccess(false), 2000);
    load();
  };

  const receiveWork = async (id: string) => {
    await supabase.from("lab_work").update({
      received_from: rPerson || null,
      received_date: today(),
      status: "Received",
    }).eq("id", id);
    loadPendingReceive(); load();
  };

  return (
    <div>
      <PageHeader title="Lab Work" />
      <FormCard>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <ADropdown label="Center" options={branches.map(b=>b.name)} value={fCenter} onChange={setFCenter} />
          <ADropdown label="Lab"    options={labOptions}              value={fLab}    onChange={v => { setFLab(v); }} required />
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 mb-5">
          {(["give", "receive"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === "receive") loadPendingReceive(); }}
              className={`px-6 py-2.5 text-sm font-medium capitalize transition-colors ${tab === t ? "border-b-2 border-[#1e2d5a] text-[#1e2d5a]" : "text-gray-400 hover:text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>

        {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-600 mb-2">Lab work recorded.</p>}

        {tab === "give" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Giving to Person</label>
              <input value={gPerson} onChange={e => setGPerson(e.target.value)} placeholder="Name of person receiving lab work..."
                className="border border-gray-300 rounded bg-white px-3 py-2 text-sm max-w-md outline-none focus:border-[#1e2d5a]" />
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-xs">
                <thead><tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Patient</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Lab Work</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Notes</th>
                </tr></thead>
                <tbody>
                  {gItems.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <input value={item.patient} onChange={e => setGItems(prev => prev.map((r, idx) => idx === i ? { ...r, patient: e.target.value } : r))}
                          placeholder="Patient name..." className="border border-gray-300 rounded px-2 py-1 text-xs w-36 outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.work} onChange={e => setGItems(prev => prev.map((r, idx) => idx === i ? { ...r, work: e.target.value } : r))}
                          placeholder="e.g. PFM Crown" className="border border-gray-300 rounded px-2 py-1 text-xs w-40 outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.notes} onChange={e => setGItems(prev => prev.map((r, idx) => idx === i ? { ...r, notes: e.target.value } : r))}
                          placeholder="Notes..." className="border border-gray-300 rounded px-2 py-1 text-xs w-40 outline-none" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setGItems(prev => [...prev, { patient: "", work: "", notes: "" }])}
              className="text-xs text-[#1e2d5a] hover:underline">+ Add Row</button>
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <PrimaryButton onClick={giveWork}>{saving ? "Saving..." : "GIVE"}</PrimaryButton>
              <ResetButton onClick={() => { setGPerson(""); setGItems([{ patient: "", work: "", notes: "" }]); }} />
            </div>
          </div>
        )}

        {tab === "receive" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Receiving from Person</label>
              <input value={rPerson} onChange={e => setRPerson(e.target.value)} placeholder="Name of person returning lab work..."
                className="border border-gray-300 rounded bg-white px-3 py-2 text-sm max-w-md outline-none focus:border-[#1e2d5a]" />
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {rItems.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-300 text-sm">No pending lab work to receive</div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead><tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Patient</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Work</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Given Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 w-20" />
                  </tr></thead>
                  <tbody>
                    {rItems.map(r => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">{r.patient_name}</td>
                        <td className="px-3 py-2">{r.work_description ?? "—"}</td>
                        <td className="px-3 py-2">{fmtDate(r.given_date)}</td>
                        <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                        <td className="px-3 py-2">
                          <button onClick={() => receiveWork(r.id)}
                            className="bg-[#1e2d5a] text-white rounded px-2 py-0.5 text-[10px] hover:bg-[#1a2650]">
                            Receive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <ResetButton onClick={() => setRPerson("")} />
            </div>
          </div>
        )}
      </FormCard>

      {/* History table */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">History</p>
        <FilterBar onView={load} onReset={() => { setFFrom(today()); setFTo(today()); setRows([]); }}>
          <ADate label="From" value={fFrom} onChange={setFFrom} />
          <ADate label="To"   value={fTo}   onChange={setFTo} />
        </FilterBar>
        <div className="mt-3">
          {loading ? <LoadingRows cols={5} /> : (
            <AdminTable
              columns={["Date","Lab","Patient","Work","Status"]}
              rows={rows.map(r => [
                fmtDate(r.given_date ?? r.created_at),
                r.lab_name,
                <span className="text-blue-600 font-medium">{r.patient_name}</span>,
                r.work_description ?? "—",
                <StatusBadge status={r.status} />,
              ])}
            />
          )}
        </div>
      </div>
    </div>
  );
}
