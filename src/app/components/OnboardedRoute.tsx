import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

export function OnboardedRoute() {
  const { user } = useAuth();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("profile_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfileComplete((data?.profile_complete as boolean) ?? false);
      });
  }, [user]);

  if (profileComplete === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profileComplete) {
    return <Navigate to="/setup-profile" replace />;
  }

  return <Outlet />;
}
