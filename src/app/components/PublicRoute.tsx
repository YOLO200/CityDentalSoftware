import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      // Same backdrop as the login page it precedes, so there's no flash of a
      // different screen while the session is checked.
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#eef2fb] via-[#f6f8fc] to-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}
