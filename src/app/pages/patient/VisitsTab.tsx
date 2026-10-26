import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useBranch } from "../../context/BranchContext";
import { loadDoctors, type Doctor } from "../calendar/data";
import { ConfirmDialog } from "./ConfirmDialog";
import { VisitForm } from "./VisitForm";
import {
  CLINICAL_FIELDS,
  deleteVisit,
  describeError,
  lineAmount,
  loadVisits,
  type TreatmentKind,
  type Visit,
} from "./visits";

/** Visits shown before "Get Lifetime Data" is pressed. */
const PAGE = 10;

const KIND_TITLE: Record<TreatmentKind, string> = {
  plan: "Treatment Plan",
  done: "Treatment Done",
  package: "Package",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  patientId: string;
  patientBranchId: string | null;
  onUpdateMedical: () => void;
}

export function VisitsTab({ patientId, patientBranchId, onUpdateMedical }: Props) {
  const { branches } = useBranch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [lifetime, setLifetime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // null = form closed; {} = new visit; {existing} = editing.
  const [form, setForm] = useState<{ existing?: Visit } | null>(null);
  const [deleting, setDeleting] = useState<Visit | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDoctors().then(setDoctors); }, []);

  const load = useCallback(async (all: boolean) => {
    setError(null);
    try {
      const res = await loadVisits(patientId, all ? null : PAGE);
      setVisits(res.visits);
      setHasMore(res.hasMore);
      // Lifetime view opens everything; otherwise only the latest visit.
      setExpanded(new Set(all ? res.visits.map((v) => v.id) : res.visits.slice(0, 1).map((v) => v.id)));
    } catch (err) {
      setError(describeError(err));
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(lifetime); }, [load, lifetime]);

  const doctorName = useMemo(() => new Map(doctors.map((d) => [d.id, d.name])), [doctors]);
  const branchName = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSaved = () => {
    setForm(null);
    load(lifetime);
  };

  const handleDelete = async (v: Visit): Promise<string | null> => {
    try {
      const ok = await deleteVisit(v.id);
      if (!ok) return "You don't have permission to delete this visit.";
    } catch (err) {
      return describeError(err);
    }
    setVisits((prev) => prev.filter((x) => x.id !== v.id));
    return null;
  };

  // ── Visit card body ───────────────────────────────────────────────────────

  const renderBody = (v: Visit) => {
    const clinical = CLINICAL_FIELDS.filter((f) => v[f.key]);
    const kinds = (["plan", "done", "package"] as TreatmentKind[]).filter((k) => v.treatments.some((t) => t.kind === k));
    const empty = !clinical.length && !kinds.length && !v.prescriptions.length && !v.instructions;

    if (empty) return <p className="text-xs text-gray-400">Nothing recorded for this visit.</p>;

    return (
      <div className="space-y-4 text-xs">
        {clinical.length > 0 && (
          <div>
            <h4 className="mb-1.5 font-semibold text-[#1e2d5a]">Clinical Note</h4>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[max-content_1fr]">
              {clinical.map((f) => (
                <div key={f.key} className="contents">
                  <dt className="text-gray-400">{f.label}</dt>
                  <dd className="whitespace-pre-line text-gray-700">{v[f.key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {kinds.map((k) => {
          const rows = v.treatments.filter((t) => t.kind === k);
          const total = rows.reduce((s, r) => s + lineAmount(r), 0);
          return (
            <div key={k}>
              <h4 className="mb-1.5 font-semibold text-[#1e2d5a]">{KIND_TITLE[k]}</h4>
              <div className="overflow-x-auto rounded border border-gray-100">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-3 py-1.5 font-medium">{k === "package" ? "Package" : "Treatment"}</th>
                      {k !== "package" && <th className="px-3 py-1.5 font-medium">Teeth</th>}
                      <th className="px-3 py-1.5 font-medium">{k === "package" ? "Sessions" : "Qty"}</th>
                      <th className="px-3 py-1.5 font-medium">Cost</th>
                      <th className="px-3 py-1.5 font-medium">Discount</th>
                      <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                      <th className="px-3 py-1.5 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-gray-700">{r.treatment}</td>
                        {k !== "package" && <td className="px-3 py-1.5">{r.teeth.join(", ") || "—"}</td>}
                        <td className="px-3 py-1.5">{r.quantity}</td>
                        <td className="px-3 py-1.5">{inr(r.unit_cost)}</td>
                        <td className="px-3 py-1.5">{r.discount ? inr(r.discount) : "—"}</td>
                        <td className="px-3 py-1.5 text-right">{inr(lineAmount(r))}</td>
                        <td className="px-3 py-1.5 text-gray-500">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                      <td className="px-3 py-1.5 text-right" colSpan={k === "package" ? 4 : 5}>Total</td>
                      <td className="px-3 py-1.5 text-right">{inr(total)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

        {v.prescriptions.length > 0 && (
          <div>
            <h4 className="mb-1.5 font-semibold text-[#1e2d5a]">Prescriptions</h4>
            <div className="overflow-x-auto rounded border border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    {["Drug", "Dosage", "Duration", "Qty", "Instructions"].map((h) => (
                      <th key={h} className="px-3 py-1.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.prescriptions.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-gray-700">{r.drug_name}</td>
                      <td className="px-3 py-1.5">{r.dosage || "—"}</td>
                      <td className="px-3 py-1.5">{r.duration || "—"}</td>
                      <td className="px-3 py-1.5">{r.quantity || "—"}</td>
                      <td className="px-3 py-1.5 text-gray-500">{r.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {v.instructions && (
          <div>
            <h4 className="mb-1.5 font-semibold text-[#1e2d5a]">Instructions</h4>
            <p className="whitespace-pre-line text-gray-700">{v.instructions}</p>
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={topRef} className="scroll-mt-4 space-y-4">
      {form && (
        <VisitForm
          // Remount per target so switching from one visit's edit to another
          // never carries state across.
          key={form.existing?.id ?? "new"}
          patientId={patientId}
          defaultBranchId={patientBranchId}
          doctors={doctors}
          existing={form.existing}
          onCancel={() => setForm(null)}
          onSaved={handleSaved}
          onUpdateMedical={onUpdateMedical}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {visits.length > 1 && (
          <button
            onClick={() => setExpanded(new Set([visits[0].id]))}
            className="text-sm text-[#1e2d5a] hover:underline"
          >
            Expand latest visit only
          </button>
        )}
        <div className="ml-auto flex gap-3 sm:mx-auto">
          {!lifetime && hasMore && (
            <button
              onClick={() => setLifetime(true)}
              className="rounded border border-[#1e2d5a] px-4 py-2 text-sm text-[#1e2d5a] hover:bg-indigo-50"
            >
              Get Lifetime Data
            </button>
          )}
          {!form && (
            <button
              onClick={() => setForm({})}
              disabled={!!error}
              className="flex items-center gap-1.5 rounded bg-[#1e2d5a] px-4 py-2 text-sm text-white hover:bg-[#162048] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add New Visit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !error && visits.length === 0 && !form ? (
        <div className="rounded border border-gray-100 px-3 py-8 text-center text-xs text-gray-400">
          No visits recorded yet. Use “Add New Visit” to record one.
        </div>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => {
            const open = expanded.has(v.id);
            const doneTotal = v.treatments.filter((t) => t.kind === "done").reduce((s, t) => s + lineAmount(t), 0);
            return (
              <li key={v.id} className="rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <button onClick={() => toggle(v.id)} aria-expanded={open} className="flex flex-1 items-center gap-3 text-left">
                    {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <span className="text-sm font-semibold text-[#1e2d5a]">{formatDate(v.visit_date)}</span>
                    <span className="truncate text-xs text-gray-500">
                      {(v.doctor_id && doctorName.get(v.doctor_id)) || "Unknown doctor"}
                      {" · "}
                      {branchName.get(v.branch_id) ?? "Other centre"}
                    </span>
                    {doneTotal > 0 && <span className="ml-auto text-xs text-gray-600">Done: {inr(doneTotal)}</span>}
                  </button>
                  <button
                    onClick={() => { setForm({ existing: v }); topRef.current?.scrollIntoView({ block: "start" }); }}
                    aria-label="Edit visit"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(v)}
                    aria-label="Delete visit"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {open && <div className="border-t border-gray-100 px-4 py-3">{renderBody(v)}</div>}
              </li>
            );
          })}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete visit?"
          message={`The visit on ${formatDate(deleting.visit_date)} and its treatments and prescriptions will be permanently removed.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
