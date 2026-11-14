import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Outlet />;
  // A visitor opening the bare site gets the landing page; a deep link
  // (/patients/…) goes straight to login, since they're clearly staff.
  return <Navigate to={pathname === "/" ? "/welcome" : "/login"} replace />;
}
