import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useBranch } from "../context/BranchContext";

interface Patient {
  id: string;
  code: string | null;
  name: string;
  initials: string;
  phone: string;
  lastVisit: string;
  nextAppointment: string;
  balance: number;
  status: "Active" | "Inactive";
  dateAdded: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

const PAGE_SIZE = 15;

/**
 * Page numbers to render, with ellipses once the count grows.
 * Always includes first and last, plus a window around the current page, so the
 * control stays a fixed width instead of growing with the patient count.
 */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | "…")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);

  if (from > 2) out.push("…");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push("…");

  out.push(total);
  return out;
}

export function Patients() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive" | "Recently Added" | "Recently Visited">("All");
  const [page, setPage] = useState(1);

  // Changing branch, search or filter changes which patients exist, so page 2
  // of the old result set is meaningless — go back to the first page.
  useEffect(() => {
    setPage(1);
  }, [selectedBranch, searchTerm, filterStatus]);

  // Scoped to the header's branch, refetched when it changes. RLS enforces the
  // same boundary server-side — this filter makes the selected branch
  // meaningful, it is not what makes the data safe.
  useEffect(() => {
    if (!selectedBranch) {
      setPatients([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from("patients")
      .select("id, patient_code, first_name, last_name, phone, last_dental_visit, balance_due, is_active, created_at")
      .eq("branch_id", selectedBranch.id)
      .then(({ data }) => {
        if (cancelled) return;
        setPatients(
          (data ?? []).map((p) => ({
            id: p.id as string,
            code: (p.patient_code as string | null) ?? null,
            name: `${p.first_name} ${p.last_name}`,
            initials: initials(p.first_name as string, p.last_name as string),
            phone: p.phone as string,
            lastVisit: formatDate(p.last_dental_visit as string | null),
            nextAppointment: "Not scheduled",
            balance: (p.balance_due as number) ?? 0,
            status: (p.is_active as boolean) ? "Active" : "Inactive",
            dateAdded: p.created_at as string,
          }))
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBranch]);

  const handleDelete = async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const parseDate = (dateStr: string) => new Date(dateStr);

  const filteredPatients = patients
    .filter((patient) => {
      // Patient ID is searchable with or without the leading '#'.
      const term = searchTerm.trim().toLowerCase().replace(/^#/, "");
      const matchesSearch =
        term === "" ||
        patient.name.toLowerCase().includes(term) ||
        patient.phone.includes(term) ||
        (patient.code ?? "").toLowerCase().includes(term);
      
      let matchesFilter = true;
      if (filterStatus === "Active" || filterStatus === "Inactive") {
        matchesFilter = patient.status === filterStatus;
      }
      // "Recently Added" / "Recently Visited" do not filter; they sort, below.
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (filterStatus === "Recently Added") {
        return parseDate(b.dateAdded).getTime() - parseDate(a.dateAdded).getTime();
      } else if (filterStatus === "Recently Visited") {
        return parseDate(b.lastVisit).getTime() - parseDate(a.lastVisit).getTime();
      }
      return 0; // Default order
    });

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  // Clamped rather than stored blindly: deleting the last patient on the final
  // page, or narrowing a search, can leave `page` past the end.
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visiblePatients = filteredPatients.slice(pageStart, pageStart + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl">Patients</h1>
          <Link 
            to="/patients/add"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            + Add Patient
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-input-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "All" | "Active" | "Inactive" | "Recently Added" | "Recently Visited")}
              className="appearance-none rounded-xl border border-border bg-input-background py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Patients</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Recently Added">Recently Added</option>
              <option value="Recently Visited">Recently Visited</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">Patient</th>
                  <th className="px-6 py-4 text-left text-sm">Phone</th>
                  <th className="px-6 py-4 text-left text-sm">Last Visit</th>
                  <th className="px-6 py-4 text-left text-sm">Next Appointment</th>
                  <th className="px-6 py-4 text-left text-sm">Balance Due</th>
                  <th className="px-6 py-4 text-left text-sm">Status</th>
                  <th className="px-6 py-4 text-left text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="border-b border-border hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                          {patient.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm">{patient.name}</div>
                          {patient.code && (
                            <div className="text-xs text-muted-foreground">#{patient.code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {patient.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {patient.lastVisit}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {patient.nextAppointment}
                    </td>
                    <td className="px-6 py-4">
                      {patient.balance > 0 ? (
                        <span
                          className={`text-sm ${
                            patient.balance > 5000
                              ? "text-red-600"
                              : patient.balance > 0
                                ? "text-amber-600"
                                : "text-foreground"
                          }`}
                        >
                          ₹{patient.balance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">₹0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs ${
                          patient.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="rounded-lg p-2 hover:bg-secondary"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
                          className="rounded-lg p-2 hover:bg-secondary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="rounded-lg p-2 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {!selectedBranch
                        ? "Select a branch to see its patients."
                        : patients.length === 0
                          ? `No patients at ${selectedBranch.name} yet.`
                          : "No patients match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Results Summary + Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {filteredPatients.length === 0
                ? "No patients"
                : `Showing ${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filteredPatients.length)} of ${filteredPatients.length}`}
              {selectedBranch ? ` at ${selectedBranch.name}` : ""}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {pageNumbers(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={`min-w-9 rounded-lg px-3 py-1.5 text-sm ${
                        p === currentPage
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-2 hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}