import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { OnboardedRoute } from "./components/OnboardedRoute";
import { AccountReadyRoute } from "./components/AccountReadyRoute";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { PageSpinner } from "./components/PageSpinner";
import { Login } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { AcceptInvite } from "./pages/AcceptInvite";

/**
 * Pages inside the app are code-split: each loads on first visit instead of
 * shipping in one bundle with the login and landing pages. The router keeps
 * the current page on screen until the next one has loaded.
 */
const page = <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) =>
  async () => ({ Component: (await load())[name] as React.ComponentType });

export const router = createBrowserRouter([
  // Deliberately NOT under PublicRoute: the invite token creates a session
  // before this renders, and PublicRoute bounces anyone with a session to "/".
  // That made the set-password screen unreachable. It is not under
  // ProtectedRoute either — it handles the no-session case itself, showing an
  // "invalid or expired link" message.
  { path: "/accept-invite", Component: AcceptInvite, ErrorBoundary: RouteErrorBoundary },
  // Capabilities page. Outside every guard so it renders at once instead of
  // waiting on the session check; logged-out visitors to "/" are sent here by
  // ProtectedRoute, and it offers "Open dashboard" to anyone signed in.
  { path: "/welcome", Component: Landing, ErrorBoundary: RouteErrorBoundary },
  {
    // Public-only routes: redirect to / if already logged in
    Component: PublicRoute,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      // Public signup is deliberately absent: accounts are created only by
      // an admin issuing an invite (Settings -> Users).
      { path: "/login", Component: Login },
    ],
  },
  {
    // Protected routes: redirect to /login if not authenticated
    Component: ProtectedRoute,
    ErrorBoundary: RouteErrorBoundary,
    // Shown on a cold load of a deep link while its page chunk downloads.
    HydrateFallback: PageSpinner,
    children: [
      {
        // Blocks everything until an invited user has set a password.
        Component: AccountReadyRoute,
        children: [
          // Onboarding — no sidebar, accessible before profile is complete
          { path: "/setup-profile", lazy: page(() => import("./pages/SetupProfile"), "SetupProfile") },
          {
            // Onboarded guard: redirects to /setup-profile if profile_complete is false
            Component: OnboardedRoute,
            children: [
              {
                Component: Layout,
                children: [
                  { path: "/", lazy: page(() => import("./pages/Dashboard"), "Dashboard") },
                  { path: "/patients", lazy: page(() => import("./pages/Patients"), "Patients") },
                  { path: "/patients/add", lazy: page(() => import("./pages/AddPatient"), "AddPatient") },
                  { path: "/patients/:id", lazy: page(() => import("./pages/PatientDetail"), "PatientDetail") },
                  { path: "/calendar", lazy: page(() => import("./pages/Calendar"), "Calendar") },
                  { path: "/profile", lazy: page(() => import("./pages/Profile"), "Profile") },
                  { path: "/reports", lazy: page(() => import("./pages/Reports"), "Reports") },
                  { path: "/admin", lazy: page(() => import("./pages/Admin"), "Admin") },
                  { path: "/crm", lazy: page(() => import("./pages/CRM"), "default") },
                  { path: "/help", lazy: page(() => import("./pages/ComingSoon"), "ComingSoon") },
                  { path: "/settings", lazy: page(() => import("./pages/Settings"), "default") },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
