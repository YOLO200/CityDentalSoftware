import { useEffect, useState, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useBranch } from "../context/BranchContext";

/**
 * The demo login works in a branch flagged branches.is_demo (migration 025).
 * Its sample data is rebuilt around today by refresh_demo_data(), at most once
 * a day server-side; this file makes sure that has happened before any page
 * queries the branch, and labels the workspace so nobody mistakes it for
 * real patients.
 */

/** Local-time YYYY-MM-DD, so the once-a-day key flips at local midnight. */
function todayKey() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `dentosys.demoRefreshed:${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Renders children only once today's demo data is in place. */
export function DemoGate({ children }: { children: ReactNode }) {
  const { selectedBranch } = useBranch();
  const isDemo = !!selectedBranch?.is_demo;
  const [ready, setReady] = useState(!isDemo);

  useEffect(() => {
    if (!isDemo) { setReady(true); return; }
    const key = todayKey();
    try {
      if (sessionStorage.getItem(key)) { setReady(true); return; }
    } catch { /* storage unavailable — just call the RPC */ }

    let cancelled = false;
    setReady(false);
    supabase.rpc("refresh_demo_data").then(({ error }) => {
      if (cancelled) return;
      // Never block the app on this: on failure, show whatever data exists.
      if (error) console.error("refresh_demo_data failed:", error);
      try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [isDemo]);

  if (!ready) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        Preparing today's demo data…
      </div>
    );
  }
  return <>{children}</>;
}

export function DemoBanner() {
  const { selectedBranch } = useBranch();
  if (!selectedBranch?.is_demo) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-teal-700 px-4 py-1.5 text-center text-xs text-white">
      <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        <span className="font-semibold">Demo workspace.</span> Sample patients and appointments, refreshed daily around today's date. Anything you add, including new patients, is cleared at the next refresh.
      </span>
    </div>
  );
}
