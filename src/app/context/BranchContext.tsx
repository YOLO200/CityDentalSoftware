import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Branch {
  id: string;
  name: string;
}

interface BranchContextValue {
  /**
   * Active branches this user may access — RLS scopes public.branches to their
   * assignments, so this is not necessarily every branch in the clinic.
   */
  branches: Branch[];
  /** null until loaded, and stays null when the user has no branch at all. */
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

// Keyed per user: the branch list is access-controlled, so one shared key
// would briefly show a user the previous user's branch names after a
// logout/login on the same browser.
const storageKey = (userId: string) => `dentosys.selectedBranchId:${userId}`;
const cacheKey = (userId: string) => `dentosys.branchList:${userId}`;

/**
 * The branch list is tiny and changes rarely, but everything downstream waits
 * on it — the Dashboard cannot issue its query until a branch id exists. Seed
 * from cache so repeat visits skip that round trip entirely, then revalidate
 * against the server and overwrite. A stale cached name shows for one paint at
 * most; a branch the user has lost access to is dropped by the reconcile below.
 */
function readCache(userId: string): Branch[] {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelected] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Signed out: hold nothing in memory. Each user's cache stays under its
    // own key, so the next sign-in reads only its own.
    if (!userId) {
      setBranches([]);
      setSelected(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Seed from this user's cache so the Dashboard can issue its query without
    // waiting on the round trip.
    const cached = readCache(userId);
    const storedId = localStorage.getItem(storageKey(userId));
    setBranches(cached);
    setSelected(cached.find((b) => b.id === storedId) ?? cached[0] ?? null);
    setIsLoading(cached.length === 0);

    supabase
      .from("branches")
      .select("id, name")
      .eq("status", "Active")
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        // RLS already limits this to branches the user may see, so the
        // selector lists exactly what they are allowed to work in.
        const rows = data ?? [];
        setBranches(rows);
        localStorage.setItem(cacheKey(userId), JSON.stringify(rows));

        // Reconcile: keep the current selection if it is still permitted, else
        // the stored id, else the first branch. This is what drops a branch the
        // user has just lost access to, rather than leaving it selected.
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
  }, [userId]);

  const setSelectedBranch = (branch: Branch) => {
    setSelected(branch);
    if (userId) localStorage.setItem(storageKey(userId), branch.id);
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
