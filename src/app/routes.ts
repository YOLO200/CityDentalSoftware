import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { AddPatient } from "./pages/AddPatient";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { ComingSoon } from "./pages/ComingSoon";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "patients", Component: Patients },
      { path: "patients/add", Component: AddPatient },
      { path: "calendar", Component: Calendar },
      { path: "profile", Component: Profile },
      { path: "reports", Component: ComingSoon },
      { path: "admin", Component: ComingSoon },
      { path: "crm", Component: ComingSoon },
      { path: "help", Component: ComingSoon },
      { path: "settings", Component: ComingSoon },
    ],
  },
]);