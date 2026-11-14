import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BranchProvider } from "../context/BranchContext";
import { DemoBanner, DemoGate } from "./DemoWorkspace";

export function Layout() {
  return (
    <BranchProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <DemoBanner />
          <main className="flex-1 overflow-y-auto">
            <DemoGate>
              <Outlet />
            </DemoGate>
          </main>
        </div>
      </div>
    </BranchProvider>
  );
}
