import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "../lib/permissions/hooks";
import { Toaster } from "sonner";
import * as Sentry from "@sentry/react";
import { ErrorScreen } from "./components/RouteErrorBoundary";

export default function App() {
  return (
    // Catches errors outside any route (the providers themselves); route
    // errors are caught by RouteErrorBoundary in routes.ts.
    <Sentry.ErrorBoundary fallback={<ErrorScreen />}>
      <AuthProvider>
        <PermissionProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors closeButton />
        </PermissionProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}
