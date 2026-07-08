import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "../lib/permissions/hooks";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors closeButton />
      </PermissionProvider>
    </AuthProvider>
  );
}
