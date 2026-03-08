import { Lock, Shield, LogOut } from "lucide-react";
import { Toggle } from "../form/Toggle";

interface Session {
  device: string;
  location: string;
  time: string;
  current: boolean;
}

interface AccountSecurityCardProps {
  twoFactorAuth: boolean;
  recentSessions: Session[];
  onToggle2FA: (checked: boolean) => void;
  onLogout: () => void;
}

export function AccountSecurityCard({
  twoFactorAuth,
  recentSessions,
  onToggle2FA,
  onLogout,
}: AccountSecurityCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
        Account & Security
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your password regularly for security</p>
          </div>
          <button className="rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </button>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Toggle checked={twoFactorAuth} onChange={onToggle2FA} />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Recent Session Activity</p>
              <p className="text-xs text-muted-foreground">Your recent login sessions</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.time}
                    </p>
                  </div>
                </div>
                {session.current && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Current Session
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-destructive hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
}
