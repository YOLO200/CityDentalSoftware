import { useEffect, useState } from "react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  /** Resolve to an error message to keep the dialog open and show it, or null on success. */
  onConfirm: () => Promise<string | null>;
}

/** Destructive-action confirmation, styled to match NoteModal. */
export function ConfirmDialog({ title, message, confirmLabel = "DELETE", onClose, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    const err = await onConfirm();
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="mb-2 text-base font-semibold text-[#1e2d5a]">{title}</h2>
        <p className="mb-5 text-sm text-gray-600">{message}</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "DELETING…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
