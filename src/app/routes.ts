import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { OnboardedRoute } from "./components/OnboardedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { AddPatient } from "./pages/AddPatient";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { SetupProfile } from "./pages/SetupProfile";
import { ComingSoon } from "./pages/ComingSoon";
import { PatientDetail } from "./pages/PatientDetail";

export const router = createBrowserRouter([
  {
    // Public-only routes: redirect to / if already logged in
    Component: PublicRoute,
    children: [
      { path: "/login", Component: Login },
      { path: "/signup", Component: SignUp },
    ],
  },
  {
    // Protected routes: redirect to /login if not authenticated
    Component: ProtectedRoute,
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
              { path: "/reports", Component: ComingSoon },
              { path: "/admin", Component: ComingSoon },
              { path: "/crm", Component: ComingSoon },
              { path: "/help", Component: ComingSoon },
              { path: "/settings", Component: ComingSoon },
            ],
          },
        ],
      },
    ],
  },
]);
