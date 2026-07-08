import { useState, useCallback } from "react";
import { MoreVertical, Pencil } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  ADropdown, ADate, AInput, AdminTable, FilterBar, PageHeader,
  FormCard, PrimaryButton, ResetButton, StatusBadge, NewButton,
  fmtDate, LoadingRows, useBranches, useProfiles, useAuth,
} from "./primitives";

const today = () => new Date().toISOString().split("T")[0];

// ─── Doctor Unavailability ────────────────────────────────────────────────────

export function DoctorUnavailability() {
  const { user }   = useAuth();
  const branches   = useBranches();
  const profiles   = useProfiles();
  const [rows,     setRows]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // filter state
  const [fBranch, setFBranch] = useState("All Centers");
  const [fStatus, setFStatus] = useState("Active");

  // form state
  const [fDoctor,   setFDoctor]   = useState("");
  const [fCenter,   setFCenter]   = useState("");
  const [fFrom,     setFFrom]     = useState(today());
  const [fTo,       setFTo]       = useState(today());
  const [fReason,   setFReason]   = useState("");
  const [fFormStatus, setFFormStatus] = useState("Active");

  const branchNames  = ["All Centers", ...branches.map(b => b.name)];
  const doctorNames  = ["Select Doctor", ...profiles.map(p => p.name)];
  const branchMap    = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const doctorMap    = Object.fromEntries(profiles.map(p => [p.name, p.id]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("doctor_unavailability")
      .select("*, branches(name)")
      .order("from_date", { ascending: false });
    if (fStatus !== "All") q = q.eq("status", fStatus);
    if (fBranch !== "All Centers") {
      const bid = branchMap[fBranch];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    if (!data) { setLoading(false); return; }
    // enrich with doctor name
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.name]));
    setRows(data.map((r: any) => ({
      ...r,
      doctor_name: profileMap[r.doctor_id] ?? "—",
      branch_name: r.branches?.name ?? "—",
    })));
    setLoading(false);
  }, [fBranch, fStatus, branches, profiles]);

  const save = async () => {
    if (!fDoctor || fDoctor === "Select Doctor" || !fFrom || !fTo) {
      setError("Doctor, From Date, and To Date are required."); return;
    }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("doctor_unavailability").insert({
      created_by: user?.id ?? null,
      doctor_id:  doctorMap[fDoctor] ?? null,
      branch_id:  branchMap[fCenter] ?? null,
      from_date:  fFrom, to_date: fTo,
      reason:     fReason || null, status: fFormStatus,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setShowForm(false);
    setFDoctor(""); setFCenter(""); setFFrom(today()); setFTo(today()); setFReason("");
    load();
  };

  const resetFilters = () => { setFBranch("All Centers"); setFStatus("Active"); setRows([]); };

  return (
    <div>
      <PageHeader title="Doctor Unavailability" rightSlot={<NewButton onClick={() => setShowForm(s => !s)} />} />

      {showForm && (
        <FormCard>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ADropdown label="Doctor"    options={doctorNames}          value={fDoctor}      onChange={setFDoctor}      required />
            <ADropdown label="Center"    options={branches.map(b=>b.name)} value={fCenter}   onChange={setFCenter} />
            <ADropdown label="Status"    options={["Active","Inactive"]} value={fFormStatus} onChange={setFFormStatus} />
            <ADate     label="From Date" value={fFrom} onChange={setFFrom} required />
            <ADate     label="To Date"   value={fTo}   onChange={setFTo}   required />
            <AInput    label="Reason"    value={fReason} onChange={setFReason} placeholder="Reason for unavailability" />
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <PrimaryButton onClick={save}>{saving ? "Saving..." : "SAVE"}</PrimaryButton>
            <ResetButton onClick={() => setShowForm(false)} />
          </div>
        </FormCard>
      )}

      <div className="mt-4">
        <FilterBar onView={load} onReset={resetFilters}>
          <ADropdown label="Center" options={branchNames}             value={fBranch} onChange={setFBranch} className="w-44" />
          <ADropdown label="Status" options={["Active","Inactive","All"]} value={fStatus} onChange={setFStatus} className="w-32" />
        </FilterBar>
      </div>
      <div className="mt-4">
        {loading ? <LoadingRows cols={7} /> : (
          <AdminTable
            columns={["Doctor Name", "Center", "From", "To", "Reason", "Status", ""]}
            rows={rows.map(r => [
              <span className="font-medium text-[#1e2d5a]">{r.doctor_name}</span>,
              r.branch_name, fmtDate(r.from_date), fmtDate(r.to_date),
              <span className="italic text-gray-500">{r.reason || "—"}</span>,
              <StatusBadge status={r.status} />,
              <button className="text-gray-400 hover:text-gray-700"><MoreVertical className="h-4 w-4" /></button>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

// ─── Access Audit ─────────────────────────────────────────────────────────────

const MODULES = ["All Modules", "Patients", "Calendar", "Reports", "Admin", "CRM"];

export function AccessAudit() {
  const branches  = useBranches();
  const profiles  = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [fBranch, setFBranch] = useState("All Centers");
  const [fUser,   setFUser]   = useState("All Users");
  const [fFrom,   setFFrom]   = useState(today());
  const [fTo,     setFTo]     = useState(today());
  const [fModule, setFModule] = useState("All Modules");

  const branchNames  = ["All Centers", ...branches.map(b => b.name)];
  const userNames    = ["All Users",   ...profiles.map(p => p.name)];
  const branchMap    = Object.fromEntries(branches.map(b => [b.name, b.id]));
  const profileMap   = Object.fromEntries(profiles.map(p => [p.id, p.name]));

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (fFrom) q = q.gte("created_at", fFrom + "T00:00:00");
    if (fTo)   q = q.lte("created_at", fTo   + "T23:59:59");
    if (fModule !== "All Modules") q = q.eq("module", fModule);
    if (fBranch !== "All Centers") {
      const bid = branchMap[fBranch];
      if (bid) q = q.eq("branch_id", bid);
    }
    const { data } = await q;
    let filtered = (data ?? []).map((r: any) => ({
      ...r,
      user_name: profileMap[r.user_id] ?? "System",
    }));
    if (fUser !== "All Users") filtered = filtered.filter(r => r.user_name === fUser);
    setRows(filtered);
    setLoading(false);
  }, [fBranch, fUser, fFrom, fTo, fModule, branches, profiles]);

  const reset = () => { setFBranch("All Centers"); setFUser("All Users"); setFFrom(today()); setFTo(today()); setFModule("All Modules"); setRows([]); };

  return (
    <div>
      <PageHeader title="Access Audit" />
      <FilterBar onView={load} onReset={reset}>
        <ADropdown label="Center" options={branchNames} value={fBranch} onChange={setFBranch} className="w-44" />
        <ADropdown label="User"   options={userNames}   value={fUser}   onChange={setFUser}   className="w-44" />
        <ADate     label="From"   value={fFrom}         onChange={setFFrom} />
        <ADate     label="To"     value={fTo}           onChange={setFTo} />
        <ADropdown label="Module" options={MODULES}     value={fModule} onChange={setFModule} className="w-36" />
      </FilterBar>
      <div className="mt-4">
        {loading ? <LoadingRows cols={8} /> : (
          <AdminTable
            columns={["Date & Time", "User", "Module", "Action", "IP Address", "Device", "Status"]}
            rows={rows.map(r => [
              <span className="font-mono text-[10px]">{new Date(r.created_at).toLocaleString("en-GB")}</span>,
              <span className="font-medium">{r.user_name}</span>,
              r.module ?? "—", r.action ?? "—",
              <span className="font-mono text-[10px] text-gray-500">{r.ip_address ?? "—"}</span>,
              r.device ?? "—",
              <StatusBadge status={r.status ?? "Success"} />,
            ])}
          />
        )}
      </div>
    </div>
  );
}
