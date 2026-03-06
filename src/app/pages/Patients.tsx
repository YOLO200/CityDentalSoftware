import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, Eye, Edit, Trash2 } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  initials: string;
  phone: string;
  lastVisit: string;
  nextAppointment: string;
  balance: number;
  status: "Active" | "Inactive";
  dateAdded: string;
}

const patients: Patient[] = [
  {
    id: 1,
    name: "Emma Thompson",
    initials: "ET",
    phone: "+91 98765-43210",
    lastVisit: "Feb 10, 2026",
    nextAppointment: "Mar 5, 2026",
    balance: 0,
    status: "Active",
    dateAdded: "Jan 15, 2024",
  },
  {
    id: 2,
    name: "Michael Chen",
    initials: "MC",
    phone: "+91 98234-56780",
    lastVisit: "Feb 15, 2026",
    nextAppointment: "Feb 28, 2026",
    balance: 2500,
    status: "Active",
    dateAdded: "Mar 22, 2023",
  },
  {
    id: 3,
    name: "Sarah Davis",
    initials: "SD",
    phone: "+91 97345-67891",
    lastVisit: "Jan 22, 2026",
    nextAppointment: "Mar 10, 2026",
    balance: 0,
    status: "Active",
    dateAdded: "Jun 8, 2024",
  },
  {
    id: 4,
    name: "James Wilson",
    initials: "JW",
    phone: "+91 96456-78902",
    lastVisit: "Feb 12, 2026",
    nextAppointment: "Feb 25, 2026",
    balance: 12000,
    status: "Active",
    dateAdded: "Feb 3, 2022",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    initials: "LA",
    phone: "+91 95567-89013",
    lastVisit: "Dec 15, 2025",
    nextAppointment: "Not scheduled",
    balance: 0,
    status: "Inactive",
    dateAdded: "Sep 12, 2023",
  },
  {
    id: 6,
    name: "Robert Martinez",
    initials: "RM",
    phone: "+91 94678-90124",
    lastVisit: "Feb 18, 2026",
    nextAppointment: "Mar 1, 2026",
    balance: 5000,
    status: "Active",
    dateAdded: "Nov 7, 2024",
  },
  {
    id: 7,
    name: "Jennifer Lee",
    initials: "JL",
    phone: "+91 93789-01235",
    lastVisit: "Feb 16, 2026",
    nextAppointment: "Mar 8, 2026",
    balance: 0,
    status: "Active",
    dateAdded: "Dec 19, 2025",
  },
  {
    id: 8,
    name: "David Brown",
    initials: "DB",
    phone: "+91 92890-12346",
    lastVisit: "Feb 14, 2026",
    nextAppointment: "Feb 27, 2026",
    balance: 1500,
    status: "Active",
    dateAdded: "Apr 30, 2024",
  },
  {
    id: 9,
    name: "Maria Garcia",
    initials: "MG",
    phone: "+91 91901-23457",
    lastVisit: "Jan 30, 2026",
    nextAppointment: "Mar 15, 2026",
    balance: 0,
    status: "Active",
    dateAdded: "Aug 14, 2023",
  },
  {
    id: 10,
    name: "Thomas White",
    initials: "TW",
    phone: "+91 90012-34568",
    lastVisit: "Nov 20, 2025",
    nextAppointment: "Not scheduled",
    balance: 0,
    status: "Inactive",
    dateAdded: "Jan 5, 2023",
  },
];

export function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive" | "Recently Added" | "Recently Visited">("All");

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
                    className="border-b border-border hover:bg-blue-50/50 transition-colors"
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg p-2 hover:bg-secondary"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          className="rounded-lg p-2 hover:bg-secondary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-foreground" />
                        </button>
                        <button
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