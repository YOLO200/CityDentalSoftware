import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useProfiles } from "../admin/primitives";
import { ConfirmDialog } from "../patient/ConfirmDialog";
import { CRMEmptyState, CRMModal, CRMStatusBadge, GhostBtn, PrimaryBtn, fmtDate } from "./primitives";
import {
  LEAD_STATUS,
  OPEN_STATUSES,
  SOURCE_TYPES,
  TREATMENT_INTERESTS,
  deleteLead,
  describeCrmError,
  loadLeads,
  normalisePhone,
  saveLead,
  todayLocal,
  updateLead,
  type Lead,
  type LeadInput,
  type LeadStatus,
} from "./leads";

// ─── Shared bits ─────────────────────────────────────────────────────────────

const field = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1e2d5a]";

/** Outlined control with the label on the border, as in the reference UI. */
function Outlined({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative rounded border border-gray-300 bg-white px-3 pb-2 pt-3 focus-within:border-[#1e2d5a]">
      <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-gray-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </div>
  );
}

function SourcePicker({ type, source, onType, onSource }: {
  type: string; source: string; onType: (v: string) => void; onSource: (v: string) => void;
}) {
  return (
    <>
      <Outlined label="Source Type" required>
        <select value={type} onChange={(e) => { onType(e.target.value); onSource(""); }} className="w-full bg-transparent text-sm outline-none">
          <option value="">Select source type</option>
          {Object.keys(SOURCE_TYPES).map((t) => <option key={t}>{t}</option>)}
        </select>
      </Outlined>
      <Outlined label="Source" required>
        <select value={source} onChange={(e) => onSource(e.target.value)} disabled={!type} className="w-full bg-transparent text-sm outline-none disabled:text-gray-400">
          <option value="">{type ? "Select source" : "Pick a source type first"}</option>
          {(SOURCE_TYPES[type] ?? []).map((s) => <option key={s}>{s}</option>)}
        </select>
      </Outlined>
    </>
  );
}

function useOwnerNames() {
  const profiles = useProfiles();
  return { profiles, ownerName: useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]) };
}

function NoBranch() {
  return <CRMEmptyState message="Select a centre in the header to see enquiries." />;
}

// ─── Add / edit enquiry ──────────────────────────────────────────────────────

function LeadModal({ lead, branchId, onClose, onSaved }: {
  lead: Lead | null; branchId: string; onClose: () => void; onSaved: () => void;
}) {
  const { user } = useAuth();
  const { profiles } = useOwnerNames();
  const [f, setF] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    source_type: lead?.source_type ?? "",
    source: lead?.source ?? "",
    treatment_interest: lead?.treatment_interest ?? "",
    assigned_to: lead?.assigned_to ?? user?.id ?? "",
    follow_up_date: lead?.follow_up_date ?? todayLocal(1),
    status: (lead?.status ?? "New") as LeadStatus,
    notes: lead?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const missing = [
      !f.name.trim() && "Name",
      !normalisePhone(f.phone) && "Phone",
      !f.source_type && "Source type",
      !f.source && "Source",
      !f.assigned_to && "Sales owner",
    ].filter(Boolean);
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}.`); return; }

    setSaving(true);
    setError(null);
    const input: LeadInput = {
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim() || null,
      source_type: f.source_type,
      source: f.source,
      treatment_interest: f.treatment_interest || null,
      assigned_to: f.assigned_to,
      follow_up_date: f.follow_up_date || null,
      status: f.status,
      notes: f.notes.trim() || null,
      branch_id: lead?.branch_id ?? branchId,
    };
    try {
      await saveLead(input, lead?.id, user?.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(describeCrmError(err as { code?: string; message?: string }));
      setSaving(false);
    }
  };

  return (
    <CRMModal title={lead ? "Edit Enquiry" : "Add Enquiry"} open onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Outlined label="Name" required><input value={f.name} onChange={(e) => set("name")(e.target.value)} className="w-full text-sm outline-none" /></Outlined>
          <Outlined label="Phone" required><input type="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} className="w-full text-sm outline-none" /></Outlined>
          <Outlined label="Email"><input type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} className="w-full text-sm outline-none" /></Outlined>
          <Outlined label="Treatment">
            <select value={f.treatment_interest} onChange={(e) => set("treatment_interest")(e.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="">—</option>
              {TREATMENT_INTERESTS.map((t) => <option key={t}>{t}</option>)}
              {f.treatment_interest && !TREATMENT_INTERESTS.includes(f.treatment_interest) && <option>{f.treatment_interest}</option>}
            </select>
          </Outlined>
          <SourcePicker type={f.source_type} source={f.source} onType={set("source_type")} onSource={set("source")} />
          <Outlined label="Sales Owner" required>
            <select value={f.assigned_to} onChange={(e) => set("assigned_to")(e.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="">Select owner</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Outlined>
          <Outlined label="Next Followup date">
            <input type="date" value={f.follow_up_date} onChange={(e) => set("follow_up_date")(e.target.value)} className="w-full text-sm outline-none" />
          </Outlined>
          <Outlined label="Status">
            <select value={f.status} onChange={(e) => set("status")(e.target.value as LeadStatus)} className="w-full bg-transparent text-sm outline-none">
              {LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Outlined>
          <div className="sm:col-span-2">
            <Outlined label="Notes">
              <textarea value={f.notes} onChange={(e) => set("notes")(e.target.value)} rows={3} className="w-full resize-y text-sm outline-none" />
            </Outlined>
          </div>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={save}>{saving ? "Saving…" : "Save"}</PrimaryBtn>
        </div>
      </div>
    </CRMModal>
  );
}

// ─── Lead table ──────────────────────────────────────────────────────────────

function LeadTable({ leads, onChanged, onEdit, highlightOverdue }: {
  leads: Lead[]; onChanged: () => void; onEdit: (l: Lead) => void; highlightOverdue?: boolean;
}) {
  const { ownerName } = useOwnerNames();
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const today = todayLocal();

  const patch = async (id: string, p: Partial<LeadInput>) => {
    setRowError(null);
    try { await updateLead(id, p); onChanged(); }
    catch (err) { setRowError(describeCrmError(err as { code?: string; message?: string })); }
  };

  if (leads.length === 0) return <CRMEmptyState />;

  return (
    <>
      {rowError && <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{rowError}</div>}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-xs">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              {["Enquiry date", "Name", "Phone", "Treatment", "Source", "Sales owner", "Next follow-up", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const overdue = highlightOverdue && l.follow_up_date !== null && l.follow_up_date < today;
              return (
                <tr key={l.id} className="border-t border-gray-100 align-middle">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{fmtDate(l.created_at)}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{l.name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{l.phone ?? "—"}</td>
                  <td className="px-3 py-2">{l.treatment_interest ?? "—"}</td>
                  <td className="px-3 py-2">{[l.source_type, l.source].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-3 py-2">{(l.assigned_to && ownerName.get(l.assigned_to)) || "—"}</td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={l.follow_up_date ?? ""}
                      onChange={(e) => patch(l.id, { follow_up_date: e.target.value || null })}
                      aria-label={`Next follow-up for ${l.name}`}
                      className={`rounded border px-1.5 py-1 text-xs outline-none ${overdue ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200"}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.status}
                      onChange={(e) => patch(l.id, { status: e.target.value as LeadStatus })}
                      aria-label={`Status for ${l.name}`}
                      className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs outline-none"
                    >
                      {LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button onClick={() => onEdit(l)} aria-label={`Edit ${l.name}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleting(l)} aria-label={`Delete ${l.name}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {deleting && (
        <ConfirmDialog
          title="Delete enquiry?"
          message={`${deleting.name}'s enquiry will be permanently removed.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try { await deleteLead(deleting.id); onChanged(); return null; }
            catch (err) { return describeCrmError(err as { code?: string; message?: string }); }
          }}
        />
      )}
    </>
  );
}

function useLeads(branchId: string | undefined, statuses?: LeadStatus[]) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = statuses?.join(",");

  const reload = useCallback(async () => {
    if (!branchId) return;
    setError(null);
    try { setLeads(await loadLeads(branchId, { statuses })); }
    catch (err) { setError(describeCrmError(err as { code?: string; message?: string })); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, key]);

  useEffect(() => { reload(); }, [reload]);
  return { leads, loading, error, reload };
}

function ScreenHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl text-[#1e2d5a]">{title}</h2>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Prospect ────────────────────────────────────────────────────────────────

type FollowFilter = "overdue" | "today" | "upcoming" | "none" | "all";

export function Prospects() {
  const { selectedBranch } = useBranch();
  const { leads, loading, error, reload } = useLeads(selectedBranch?.id, OPEN_STATUSES);
  const [filter, setFilter] = useState<FollowFilter>("all");
  const [modal, setModal] = useState<{ lead: Lead | null } | null>(null);
  const today = todayLocal();

  if (!selectedBranch) return <NoBranch />;

  const match = (l: Lead) => {
    const d = l.follow_up_date;
    if (filter === "overdue") return d !== null && d < today;
    if (filter === "today") return d === today;
    if (filter === "upcoming") return d !== null && d > today;
    if (filter === "none") return d === null;
    return true;
  };
  // Earliest follow-up first; no date last.
  const rows = leads.filter(match).sort((a, b) => (a.follow_up_date ?? "9999").localeCompare(b.follow_up_date ?? "9999"));
  const count = (f: FollowFilter) => leads.filter((l) => {
    const d = l.follow_up_date;
    return f === "overdue" ? d !== null && d < today : f === "today" ? d === today : f === "upcoming" ? d !== null && d > today : f === "none" ? d === null : true;
  }).length;

  return (
    <div>
      <ScreenHeader title="Prospect">
        <PrimaryBtn onClick={() => setModal({ lead: null })}><Plus className="mr-1 inline h-3.5 w-3.5" />Add Enquiry</PrimaryBtn>
      </ScreenHeader>
      <p className="mb-3 text-xs text-gray-500">Open enquiries (New, Contacted, Interested) ordered by next follow-up.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {([["all", "All"], ["overdue", "Overdue"], ["today", "Today"], ["upcoming", "Upcoming"], ["none", "No date"]] as [FollowFilter, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-[#1e2d5a] bg-[#1e2d5a] text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            {label} ({count(f)})
          </button>
        ))}
      </div>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading ? <Spinner /> : <LeadTable leads={rows} onChanged={reload} onEdit={(l) => setModal({ lead: l })} highlightOverdue />}
      {modal && <LeadModal lead={modal.lead} branchId={selectedBranch.id} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}

// ─── Enquiries ───────────────────────────────────────────────────────────────

export function Enquiries() {
  const { selectedBranch } = useBranch();
  const { leads, loading, error, reload } = useLeads(selectedBranch?.id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [modal, setModal] = useState<{ lead: Lead | null } | null>(null);

  if (!selectedBranch) return <NoBranch />;

  const q = search.trim().toLowerCase();
  const qPhone = normalisePhone(search);
  const rows = leads.filter((l) =>
    (!q || l.name.toLowerCase().includes(q) || (qPhone && normalisePhone(l.phone ?? "").includes(qPhone))) &&
    (!status || l.status === status) &&
    (!sourceType || l.source_type === sourceType) &&
    (!from || l.created_at.slice(0, 10) >= from) &&
    (!to || l.created_at.slice(0, 10) <= to),
  );

  const reset = () => { setSearch(""); setStatus(""); setSourceType(""); setFrom(""); setTo(""); };

  return (
    <div>
      <ScreenHeader title="Enquiries">
        <PrimaryBtn onClick={() => setModal({ lead: null })}><Plus className="mr-1 inline h-3.5 w-3.5" />Add Enquiry</PrimaryBtn>
      </ScreenHeader>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone" className={field} aria-label="Search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={field} aria-label="Status">
          <option value="">All statuses</option>
          {LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={field} aria-label="Source type">
          <option value="">All source types</option>
          {Object.keys(SOURCE_TYPES).map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} aria-label="From date" />
        <div className="flex gap-2">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={field} aria-label="To date" />
          <GhostBtn onClick={reset}>Reset</GhostBtn>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {LEAD_STATUS.map((s) => (
          <span key={s} className="flex items-center gap-1"><CRMStatusBadge status={s} /> {leads.filter((l) => l.status === s).length}</span>
        ))}
      </div>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading ? <Spinner /> : <LeadTable leads={rows} onChanged={reload} onEdit={(l) => setModal({ lead: l })} />}
      {modal && <LeadModal lead={modal.lead} branchId={selectedBranch.id} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e2d5a] border-t-transparent" />
    </div>
  );
}

// ─── Campaign Widget (quick capture + CSV upload) ────────────────────────────

export function CampaignWidget() {
  const [tab, setTab] = useState<"widget" | "upload">("widget");
  return (
    <div>
      <div className="mb-5 flex gap-8 border-b border-gray-200">
        {([["widget", "Campaign Widget"], ["upload", "Upload Enquiries"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 pb-2 text-sm ${tab === id ? "border-[#1e2d5a] font-semibold text-[#1e2d5a]" : "border-transparent text-gray-600 hover:text-gray-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "widget" ? <QuickCapture /> : <UploadEnquiries />}
    </div>
  );
}

/** Shared "who / when / where from" fields at the top of both tabs. */
function useCampaignDefaults() {
  const { user } = useAuth();
  const [owner, setOwner] = useState(user?.id ?? "");
  const [followUp, setFollowUp] = useState(todayLocal(1));
  const [sourceType, setSourceType] = useState("");
  const [source, setSource] = useState("");
  const missing = [!owner && "Sales Owner", !followUp && "Next Followup date", !sourceType && "Source Type", !source && "Source"].filter(Boolean) as string[];
  return { owner, setOwner, followUp, setFollowUp, sourceType, setSourceType, source, setSource, missing };
}

function CampaignDefaults({ d }: { d: ReturnType<typeof useCampaignDefaults> }) {
  const { profiles } = useOwnerNames();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Outlined label="Sales Owner" required>
        <select value={d.owner} onChange={(e) => d.setOwner(e.target.value)} className="w-full bg-transparent text-sm outline-none">
          <option value="">Select owner</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Outlined>
      <Outlined label="Next Followup date" required>
        <input type="date" value={d.followUp} onChange={(e) => d.setFollowUp(e.target.value)} className="w-full text-sm outline-none" />
      </Outlined>
      <SourcePicker type={d.sourceType} source={d.source} onType={d.setSourceType} onSource={d.setSource} />
    </div>
  );
}

/**
 * For camps, events and ad campaigns: set the source/owner once, then add
 * enquiries one after another without re-filling them.
 */
function QuickCapture() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const d = useCampaignDefaults();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [treatment, setTreatment] = useState("");
  const [added, setAdded] = useState<{ name: string; phone: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  if (!selectedBranch) return <NoBranch />;

  const add = async () => {
    const missing = [...d.missing, !name.trim() && "Name", !normalisePhone(phone) && "Phone"].filter(Boolean);
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}.`); return; }
    setSaving(true);
    setError(null);
    try {
      await saveLead({
        name: name.trim(), phone: phone.trim(), email: null,
        source_type: d.sourceType, source: d.source,
        treatment_interest: treatment || null, assigned_to: d.owner,
        follow_up_date: d.followUp, status: "New", notes: null,
        branch_id: selectedBranch.id,
      }, undefined, user?.id);
      setAdded((a) => [{ name: name.trim(), phone: phone.trim() }, ...a]);
      setName(""); setPhone(""); setTreatment("");
      nameRef.current?.focus();
    } catch (err) {
      setError(describeCrmError(err as { code?: string; message?: string }));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Capture enquiries from a camp, event or ad campaign. Set the campaign details once, then add people one after another.
      </p>
      <CampaignDefaults d={d} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Outlined label="Name" required><input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm outline-none" /></Outlined>
        <Outlined label="Phone" required>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="w-full text-sm outline-none" />
        </Outlined>
        <Outlined label="Treatment">
          <select value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full bg-transparent text-sm outline-none">
            <option value="">—</option>
            {TREATMENT_INTERESTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Outlined>
        <button onClick={add} disabled={saving} className="rounded bg-[#1e2d5a] px-6 py-2 text-sm text-white hover:bg-[#162048] disabled:opacity-50">
          {saving ? "Adding…" : "ADD"}
        </button>
      </div>
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
      {added.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold text-[#1e2d5a]">Added this session ({added.length})</div>
          <ul className="space-y-1 text-xs text-gray-600">
            {added.map((a, i) => <li key={i}>{a.name} · {a.phone}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Upload Enquiries (CSV) ──────────────────────────────────────────────────

const SAMPLE_CSV =
  "Name,Phone,Email,Treatment,Notes\r\n" +
  "Ravi Kumar,9876543210,ravi@example.com,Root Canal,Prefers evening calls\r\n" +
  "Anita Shah,+91 98200 12345,,Braces / Aligners,\r\n";

/** RFC 4180-ish: quoted fields, escaped quotes, CRLF/LF, leading BOM. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "patient name"],
  phone: ["phone", "mobile", "mobile number", "phone number", "contact"],
  email: ["email", "email id", "e-mail"],
  treatment: ["treatment", "treatment interest", "interest"],
  notes: ["notes", "note", "remarks", "comments"],
};

interface UploadResult { added: number; skipped: { row: number; reason: string }[] }

function UploadEnquiries() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const d = useCampaignDefaults();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const input = useRef<HTMLInputElement>(null);

  if (!selectedBranch) return <NoBranch />;

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "enquiries-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    d.setOwner(user?.id ?? ""); d.setFollowUp(todayLocal(1)); d.setSourceType(""); d.setSource("");
    setFile(null); setError(null); setResult(null);
    if (input.current) input.current.value = "";
  };

  const upload = async () => {
    setError(null);
    setResult(null);
    const missing = [...d.missing, !file && "CSV file"].filter(Boolean);
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}.`); return; }
    if (file!.size > 2 * 1024 * 1024) { setError("CSV is larger than 2 MB — split it into smaller files."); return; }

    setBusy(true);
    try {
      const rows = parseCsv(await file!.text());
      if (rows.length < 2) throw new Error("The file has no data rows. Use the sample CSV as a template.");

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (k: string) => header.findIndex((h) => HEADER_ALIASES[k].includes(h));
      const idx = { name: col("name"), phone: col("phone"), email: col("email"), treatment: col("treatment"), notes: col("notes") };
      if (idx.name < 0 || idx.phone < 0) throw new Error('The first row must include "Name" and "Phone" columns. Use the sample CSV as a template.');

      const skipped: UploadResult["skipped"] = [];
      const seen = new Set<string>();
      const candidates: { line: number; phone: string; row: LeadInput }[] = [];
      rows.slice(1).forEach((r, i) => {
        const line = i + 2; // 1-based, plus the header
        const get = (j: number) => (j >= 0 ? (r[j] ?? "").trim() : "");
        const name = get(idx.name);
        const phone = normalisePhone(get(idx.phone));
        if (!name) return skipped.push({ row: line, reason: "missing name" });
        if (phone.length < 10) return skipped.push({ row: line, reason: "missing or invalid phone" });
        if (seen.has(phone)) return skipped.push({ row: line, reason: "duplicate phone in file" });
        seen.add(phone);
        candidates.push({
          line, phone,
          row: {
            name, phone: get(idx.phone), email: get(idx.email) || null,
            treatment_interest: get(idx.treatment) || null, notes: get(idx.notes) || null,
            source_type: d.sourceType, source: d.source, assigned_to: d.owner,
            follow_up_date: d.followUp, status: "New", branch_id: selectedBranch.id,
          },
        });
      });

      // Skip people already enquiring at this centre.
      const existing = new Set<string>();
      const { data: current, error: exErr } = await supabase.from("crm_leads").select("phone").eq("branch_id", selectedBranch.id);
      if (exErr) throw exErr;
      for (const c of current ?? []) if (c.phone) existing.add(normalisePhone(c.phone));

      const fresh = candidates.filter((c) => {
        if (existing.has(c.phone)) { skipped.push({ row: c.line, reason: "already an enquiry at this centre" }); return false; }
        return true;
      });

      for (let i = 0; i < fresh.length; i += 500) {
        const chunk = fresh.slice(i, i + 500).map((c) => ({ ...c.row, created_by: user?.id ?? null }));
        const { error: insErr } = await supabase.from("crm_leads").insert(chunk);
        if (insErr) throw insErr;
      }

      setResult({ added: fresh.length, skipped: skipped.sort((a, b) => a.row - b.row) });
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (err) {
      const e = err as { code?: string; message?: string };
      setError(e.code ? describeCrmError(e) : e.message ?? "Upload failed.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <CampaignDefaults d={d} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => input.current?.click()} className="rounded bg-[#1e2d5a] px-5 py-2.5 text-sm text-white hover:bg-[#162048]">
            Select CSV File
          </button>
          {file && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              {file.name}
              <button onClick={() => { setFile(null); if (input.current) input.current.value = ""; }} aria-label="Remove file" className="rounded p-0.5 hover:bg-gray-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button onClick={downloadSample} className="flex items-center gap-1.5 text-sm text-[#1e2d5a] hover:underline">
          Sample CSV <FileSpreadsheet className="h-5 w-5 text-green-700" />
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

      <div className="flex justify-center gap-4 pt-2">
        <button onClick={reset} disabled={busy} className="rounded border border-gray-300 px-8 py-2.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">RESET</button>
        <button onClick={upload} disabled={busy} className="flex items-center gap-2 rounded bg-[#1e2d5a] px-8 py-2.5 text-sm text-white hover:bg-[#162048] disabled:opacity-50">
          <Upload className="h-4 w-4" />{busy ? "UPLOADING…" : "UPLOAD"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <div className="font-semibold text-green-700">{result.added} enquir{result.added === 1 ? "y" : "ies"} added.</div>
          {result.skipped.length > 0 && (
            <>
              <div className="mt-2 text-gray-600">{result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} skipped:</div>
              <ul className="mt-1 max-h-48 overflow-y-auto text-xs text-gray-500">
                {result.skipped.map((s, i) => <li key={i}>Row {s.row}: {s.reason}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
