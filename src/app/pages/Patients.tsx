import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Patient {
  id: string;
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

export function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive" | "Recently Added" | "Recently Visited">("All");

  useEffect(() => {
    supabase
      .from("patients")
      .select("id, first_name, last_name, phone, last_dental_visit, balance_due, is_active, created_at")
      .then(({ data }) => {
        if (data) {
          setPatients(
            data.map((p) => ({
              id: p.id as string,
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
        }
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  // Helper function to parse dates
  const parseDate = (dateStr: string) => new Date(dateStr);

  // Sort and filter logic
  const filteredPatients = patients
    .filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm);
      
      let matchesFilter = true;
      if (filterStatus === "Active" || filterStatus === "Inactive") {
        matchesFilter = patient.status === filterStatus;
      }
      // For "Recently Added" and "Recently Visited", we'll show all that match search
      // and sort them accordingly below
      
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
              placeholder="Search by name or phone..."
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
                {filteredPatients.map((patient) => (
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
                        <span className="text-sm">{patient.name}</span>
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
              </tbody>
            </table>
          </div>

          {/* Results Summary */}
          <div className="border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPatients.length} of {patients.length} patients
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}