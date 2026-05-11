import { useState, useCallback, useEffect } from "react";
import { AlertCircle, RefreshCw, MoreVertical } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, AInput, ATextarea, AdminTable, PageHeader, FormCard,
  PrimaryButton, ResetButton, NewButton, StatusBadge, fmtDate, LoadingRows,
  useBranches, useProfiles, useAuth, FREQ_OPTIONS,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// ─── SMS/WA Transfer ──────────────────────────────────────────────────────────

export function SmsWaTransfer() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const [credits,   setCredits]   = useState<Record<string, { sms: number; wa: number; id: string }>>({});
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const [fromBranch, setFromBranch] = useState("");
  const [toBranch,   setToBranch]   = useState("");
  const [smsQty,     setSmsQty]     = useState("");
  const [waQty,      setWaQty]      = useState("");

  const branchOptions = branches.map(b => b.name);
  const branchMap     = Object.fromEntries(branches.map(b => [b.name, b.id]));

  // Load credits for all branches
  useEffect(() => {
    if (!branches.length) return;
    supabase.from("sms_wa_credits").select("*").then(({ data }) => {
      if (!data) return;
      const map: Record<string, { sms: number; wa: number; id: string }> = {};
      data.forEach((r: any) => { map[r.branch_id] = { sms: r.sms_balance, wa: r.wa_balance, id: r.id }; });
      // Ensure every branch has a record
      branches.forEach(b => {
        if (!map[b.id]) map[b.id] = { sms: 0, wa: 0, id: "" };
      });
      setCredits(map);
    });
  }, [branches]);

  const fromId = branchMap[fromBranch] ?? "";
  const toId   = branchMap[toBranch]   ?? "";
  const fromCredits = fromId ? (credits[fromId] ?? { sms: 0, wa: 0 }) : null;

  const reset = () => { setFromBranch(""); setToBranch(""); setSmsQty(""); setWaQty(""); setError(null); setSuccess(false); };

  const transfer = async () => {
    const sms = Number(smsQty) || 0;
    const wa  = Number(waQty)  || 0;
    if (!fromBranch || !toBranch) { setError("Select both centers."); return; }
    if (fromBranch === toBranch)  { setError("Transfer centers must be different."); return; }
    if (sms === 0 && wa === 0)    { setError("Enter at least one quantity."); return; }
    if (fromCredits && sms > fromCredits.sms) { setError(`Only ${fromCredits.sms} SMS available.`); return; }
    if (fromCredits && wa  > fromCredits.wa)  { setError(`Only ${fromCredits.wa} WhatsApp available.`); return; }

    setSaving(true); setError(null);

    // Record transfer
    const { error: err } = await supabase.from("sms_wa_transfers").insert({
      created_by: user?.id ?? null,
      from_branch_id: fromId, to_branch_id: toId,
      sms_qty: sms, wa_qty: wa,
    });
    if (err) { setError(err.message); setSaving(false); return; }

    // Update credits — upsert for both branches
    await Promise.all([
      supabase.from("sms_wa_credits").upsert({
        branch_id: fromId,
        sms_balance: Math.max(0, (fromCredits?.sms ?? 0) - sms),
        wa_balance:  Math.max(0, (fromCredits?.wa  ?? 0) - wa),
        updated_at: new Date().toISOString(),
      }, { onConflict: "branch_id" }),
      supabase.from("sms_wa_credits").upsert({
        branch_id: toId,
        sms_balance: (credits[toId]?.sms ?? 0) + sms,
        wa_balance:  (credits[toId]?.wa  ?? 0) + wa,
        updated_at: new Date().toISOString(),
      }, { onConflict: "branch_id" }),
    ]);

    setSaving(false); setSuccess(true); reset();

    // Reload credits
    supabase.from("sms_wa_credits").select("*").then(({ data }) => {
      if (!data) return;
      const map: Record<string, { sms: number; wa: number; id: string }> = {};
      data.forEach((r: any) => { map[r.branch_id] = { sms: r.sms_balance, wa: r.wa_balance, id: r.id }; });
      setCredits(map);
    });
  };

  return (
    <div>
      <PageHeader title="SMS/WA Transfer" />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 w-20 h-20 bg-[#1e2d5a] rounded-xl flex items-center justify-center">
            <RefreshCw className="h-9 w-9 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#1e2d5a] mb-1">SMS/WA Transfer</h3>
            <p className="text-sm text-gray-500 mb-4">Transfer SMS and WhatsApp credits between clinic centers.</p>

            <div className="flex items-start gap-2 mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">** Only purchased messages are transferable</p>
            </div>

            {error   && <p className="text-xs text-red-500 mb-2">{error}</p>}
            {success && <p className="text-xs text-green-600 mb-2">Transfer completed successfully.</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ADropdown label="Transfer From" options={branchOptions} value={fromBranch} onChange={setFromBranch} required className="md:col-span-2" />
              <ADropdown label="Transfer To"   options={branchOptions} value={toBranch}   onChange={setToBranch}   required className="md:col-span-2" />

              {fromCredits && (
                <>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">Available SMS</div>
                    <div className="text-xl font-bold text-[#1e2d5a]">{fromCredits.sms.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">Available WhatsApp</div>
                    <div className="text-xl font-bold text-[#1e2d5a]">{fromCredits.wa.toLocaleString("en-IN")}</div>
                  </div>
                </>
              )}

              <AInput label="Transfer SMS Qty"       value={smsQty} onChange={setSmsQty} type="number" placeholder="0" />
              <AInput label="Transfer WhatsApp Qty"  value={waQty}  onChange={setWaQty}  type="number" placeholder="0" />
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <PrimaryButton onClick={transfer}>{saving ? "Processing..." : "TRANSFER"}</PrimaryButton>
              <ResetButton onClick={reset} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recurring Task ───────────────────────────────────────────────────────────

export function RecurringTask() {
  const { user }  = useAuth();
  const branches  = useBranches();
  const profiles  = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,     setFName]     = useState("");
  const [fFreq,     setFFreq]     = useState("Daily");
  const [fAssignee, setFAssignee] = useState("");
  const [fBranch,   setFBranch]   = useState("");
  const [fStart,    setFStart]    = useState(today());
  const [fNotes,    setFNotes]    = useState("");

  const branchMap  = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.name, p.id]));

  // compute next_due_date from start + frequency
  const computeNextDue = (start: string, freq: string) => {
    if (!start) return null;
    const d = new Date(start);
    switch (freq) {
      case "Daily":       d.setDate(d.getDate() + 1); break;
      case "Weekly":      d.setDate(d.getDate() + 7); break;
      case "Fortnightly": d.setDate(d.getDate() + 14); break;
      case "Monthly":     d.setMonth(d.getMonth() + 1); break;
      case "Quarterly":   d.setMonth(d.getMonth() + 3); break;
      case "Yearly":      d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split("T")[0];
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("recurring_tasks")
      .select("*, branches(name)")
      .order("next_due_date");
    const profileIdMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));
    setRows((data ?? []).map((r: any) => ({
      ...r,
      branch_name:   r.branches?.name ?? "—",
      assignee_name: profileIdMap[r.assignee_id] ?? "—",
    })));
    setLoading(false);
  }, [profiles]);

  const save = async () => {
    if (!fName || !fFreq) { setError("Task name and frequency are required."); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("recurring_tasks").insert({
      created_by:    user?.id ?? null,
      branch_id:     branchMap[fBranch] ?? null,
      name:          fName,
      frequency:     fFreq,
      assignee_id:   profileMap[fAssignee] ?? null,
      start_date:    fStart,
      next_due_date: computeNextDue(fStart, fFreq),
      notes:         fNotes || null,
      status:        "Active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFName(""); setFAssignee(""); setFBranch(""); setFStart(today()); setFNotes("");
    load();
  };

  return (
    <div>
      <PageHeader title="Recurring Task" rightSlot={<NewButton onClick={() => { setShowForm(s => !s); if (!rows.length) load(); }} />} />

      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AInput    label="Task Name"  value={fName}     onChange={setFName}     required placeholder="e.g. Daily Equipment Check" className="md:col-span-2" />
            <ADropdown label="Frequency"  options={FREQ_OPTIONS} value={fFreq}      onChange={setFFreq} />
            <ADropdown label="Assignee"   options={["Select Assignee", ...profiles.map(p => p.name)]} value={fAssignee} onChange={setFAssignee} />
            <ADropdown label="Center"     options={branches.map(b => b.name)} value={fBranch} onChange={setFBranch} />
            <ADate     label="Start Date" value={fStart}    onChange={setFStart} />
            <ATextarea label="Notes"      value={fNotes}    onChange={setFNotes}    className="md:col-span-3" />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}

      <div className="mt-4">
        {rows.length === 0 && !loading && !showForm && (
          <div className="mb-3"><button onClick={load} className="text-xs text-[#1e2d5a] hover:underline">Load tasks →</button></div>
        )}
        {loading ? <LoadingRows cols={6} /> : (
          <AdminTable
            columns={["Task Name","Frequency","Assignee","Center","Next Due","Status",""]}
            rows={rows.map(r => [
              <span className="font-medium">{r.name}</span>,
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-medium">{r.frequency}</span>,
              r.assignee_name, r.branch_name,
              fmtDate(r.next_due_date),
              <StatusBadge status={r.status} />,
              <button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-4 w-4" /></button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}
