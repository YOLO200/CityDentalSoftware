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
 * Branch to open on a user's first login, before they have picked one.
 * Matched on a name fragment rather than an id so it survives the branch being
 * recreated, and tolerates the full name ("Speedwell Premium Division").
 *
 * Only a preference: a user without access to it never sees it in the list
 * (RLS), and falls through to their first available branch instead.
 */
const DEFAULT_BRANCH_MATCH = "speedwell";

/** Stored choice if still permitted, else the default branch, else the first. */
function pickBranch(rows: Branch[], storedId: string | null): Branch | null {
  return (
    rows.find((b) => b.id === storedId) ??
    rows.find((b) => b.name.toLowerCase().includes(DEFAULT_BRANCH_MATCH)) ??
    rows[0] ??
    null
  );
}

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
    setSelected(pickBranch(cached, storedId));
    setIsLoading(cached.length === 0);

    // my_branches(), not a select on public.branches. The branches_select
    // policy also admits anyone with settings:manage — so Settings → Clinics
    // can administer every branch — and reading the table here offered an
    // admin branches that dashboard_stats then refused with
    // "not authorised for this branch". The RPC answers the narrower question:
    // which branches may this user actually work in.
    supabase
      .rpc("my_branches")
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data as Branch[] | null) ?? [];
        setBranches(rows);
        localStorage.setItem(cacheKey(userId), JSON.stringify(rows));

        // Reconcile: keep the current selection if it is still permitted, else
        // the stored id, else the first branch. This is what drops a branch the
        // user has just lost access to, rather than leaving it selected.
        setSelected((prev) => {
          const stillExists = prev && rows.find((b) => b.id === prev.id);
          if (stillExists) return stillExists;
          return pickBranch(rows, storedId);
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
