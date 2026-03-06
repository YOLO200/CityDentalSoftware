import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  UserCog,
  Handshake,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LogoutModal } from "./LogoutModal";
import logo from "figma:asset/57c840372f4a688bd44489df61e972b8c9087443.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Admin", href: "/admin", icon: UserCog },
  { name: "CRM", href: "/crm", icon: Handshake },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="flex flex-col w-20 border-r border-border bg-card">
      <div className="flex h-16 items-center justify-center border-b border-border px-2">
        <img src={logo} alt="City Dental Software" className="h-10 w-10 object-contain" />
      </div>
      <nav className="flex-1 space-y-1 px-1 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-xs transition-colors
                ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }
              `}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-center leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation - Settings & Logout */}
      <div className="border-t border-border px-2 py-4 space-y-1">
        <Link
          to="/settings"
          className={`
            flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs transition-colors
            ${
              location.pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }
          `}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          
        </Link>
        
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          
        </button>
      </div>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          // Add fade out effect before navigation
          setTimeout(() => {
            navigate("/login");
          }, 200);
        }}
      />
    </div>
  );
}