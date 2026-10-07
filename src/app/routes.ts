import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { OnboardedRoute } from "./components/OnboardedRoute";
import { AccountReadyRoute } from "./components/AccountReadyRoute";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { AddPatient } from "./pages/AddPatient";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { AcceptInvite } from "./pages/AcceptInvite";
import { SetupProfile } from "./pages/SetupProfile";
import { ComingSoon } from "./pages/ComingSoon";
import { PatientDetail } from "./pages/PatientDetail";
import { Reports } from "./pages/Reports";
import { Admin } from "./pages/Admin";
import CRM from "./pages/CRM";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  // Deliberately NOT under PublicRoute: the invite token creates a session
  // before this renders, and PublicRoute bounces anyone with a session to "/".
  // That made the set-password screen unreachable. It is not under
  // ProtectedRoute either — it handles the no-session case itself, showing an
  // "invalid or expired link" message.
  { path: "/accept-invite", Component: AcceptInvite },
  {
    // Public-only routes: redirect to / if already logged in
    Component: PublicRoute,
    children: [
      // Public signup is deliberately absent: accounts are created only by
      // an admin issuing an invite (Settings -> Users).
      { path: "/login", Component: Login },
    ],
  },
  {
    // Protected routes: redirect to /login if not authenticated
    Component: ProtectedRoute,
    children: [
      {
        // Blocks everything until an invited user has set a password.
        Component: AccountReadyRoute,
        children: [
          // Onboarding — no sidebar, accessible before profile is complete
          { path: "/setup-profile", Component: SetupProfile },
          {
            // Onboarded guard: redirects to /setup-profile if profile_complete is false
            Component: OnboardedRoute,
            children: [
              {
                Component: Layout,
                children: [
                  { path: "/", Component: Dashboard },
                  { path: "/patients", Component: Patients },
                  { path: "/patients/add", Component: AddPatient },
                  { path: "/patients/:id", Component: PatientDetail },
                  { path: "/calendar", Component: Calendar },
                  { path: "/profile", Component: Profile },
                  { path: "/reports", Component: Reports },
                  { path: "/admin", Component: Admin },
                  { path: "/crm", Component: CRM },
                  { path: "/help", Component: ComingSoon },
                  { path: "/settings", Component: Settings },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
