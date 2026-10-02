import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export interface Branch {
  id: string;
  name: string;
}

interface BranchContextValue {
  /** Every active branch, loaded from public.branches. */
  branches: Branch[];
  /** null until the branch list has loaded. */
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue>({
  branches: [],
  selectedBranch: null,
  setSelectedBranch: () => {},
  isLoading: true,
});

const STORAGE_KEY = "dentosys.selectedBranchId";
const CACHE_KEY = "dentosys.branchList";

/**
 * The branch list is tiny and changes rarely, but everything downstream waits
 * on it — the Dashboard cannot issue its query until a branch id exists. Seed
 * from cache so repeat visits skip that round trip entirely, then revalidate
 * against the server and overwrite. A stale cached name shows for one paint at
 * most; a stale id is dropped by the reconcile below.
 */
function readCache(): Branch[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const cached = readCache();
  const storedId = localStorage.getItem(STORAGE_KEY);

  const [branches, setBranches] = useState<Branch[]>(cached);
  const [selectedBranch, setSelected] = useState<Branch | null>(
    cached.find((b) => b.id === storedId) ?? cached[0] ?? null,
  );
  // Only block the UI when there is nothing cached to render.
  const [isLoading, setIsLoading] = useState(cached.length === 0);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("branches")
      .select("id, name")
      .eq("status", "Active")
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setBranches(rows);
        localStorage.setItem(CACHE_KEY, JSON.stringify(rows));

        // Reconcile: keep the current selection if the server still has it,
        // else fall back to the stored id, else the first branch.
        setSelected((prev) => {
          const stillExists = prev && rows.find((b) => b.id === prev.id);
          if (stillExists) return stillExists;
          return rows.find((b) => b.id === storedId) ?? rows[0] ?? null;
        });
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // storedId is read once at mount on purpose; selecting a branch writes it
    // but must not retrigger this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelectedBranch = (branch: Branch) => {
    setSelected(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
  };

  return (
    <BranchContext.Provider
      value={{ branches, selectedBranch, setSelectedBranch, isLoading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
