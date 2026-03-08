import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}
