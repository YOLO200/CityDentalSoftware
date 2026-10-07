import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

/**
 * Blocks everything until the invited user has actually set a password.
 *
 * Landing on /accept-invite already creates a session, so without this guard a
 * user could simply navigate away and end up with a passwordless account: usable
 * for that one session, impossible to log into ever again.
 *
 * `status` is the signal. The invite seeds the profile as 'Invited'; only
 * AcceptInvite flips it to 'Active', and it does so immediately after
 * updateUser({ password }) succeeds. So 'Invited' means "no password yet".
 *
 * This is a UX rail, not a security boundary — an Invited user already holds
 * zero permissions server-side, because current_user_has_permission is gated on
 * status = 'Active'.
 */
export function AccountReadyRoute() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        // Default to Active: a missing profile row must not lock out an
        // existing user, and those predate the invite flow entirely.
        setStatus((data?.status as string) ?? "Active");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (status === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "Invited") {
    return <Navigate to="/accept-invite" replace />;
  }

  return <Outlet />;
}
