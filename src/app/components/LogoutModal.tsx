import { AlertTriangle } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95">
          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>

          {/* Content */}
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Are you sure you want to log out?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            You will need to sign in again to access your dashboard.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}