import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export type NoteType = "social" | "internal";

export interface PatientNote {
  id: string;
  patient_id: string;
  note_type: NoteType;
  note_date: string;
  note: string;
  created_at: string;
}

interface Props {
  patientId: string;
  noteType: NoteType;
  /** Current user id, stored as created_by so authors can edit their own notes. */
  createdBy: string | null;
  onClose: () => void;
  /** Called with the inserted row so the panel can prepend it without refetching. */
  onSaved: (note: PatientNote) => void;
}

const TITLES: Record<NoteType, string> = {
  social: "Add Social Notes",
  internal: "Add Internal Notes",
};

/** Local-time YYYY-MM-DD. `toISOString()` would shift the date in IST. */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NoteModal({ patientId, noteType, createdBy, onClose, onSaved }: Props) {
  const [noteDate, setNoteDate] = useState(todayLocal);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Escape closes, matching the X button. Skipped while a save is in flight so
  // the dialog cannot be dismissed out from under a pending insert.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const canSave = note.trim().length > 0 && noteDate !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("patient_notes")
      .insert({
        patient_id: patientId,
        note_type: noteType,
        note_date: noteDate,
        note: note.trim(),
        created_by: createdBy,
      })
      .select("id, patient_id, note_type, note_date, note, created_at")
      .single();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    onSaved(data as PatientNote);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={TITLES[noteType]}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <h2 className="text-base font-semibold text-[#1e2d5a]">{TITLES[noteType]}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs text-gray-500">
            Note Date<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            type="date"
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs text-gray-500">
            Notes<span className="ml-0.5 text-red-500">*</span>
          </span>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-lg border border-indigo-400 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </label>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-7 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-[#1e2d5a] px-9 py-2.5 text-sm font-medium text-white hover:bg-[#162048] disabled:opacity-50"
          >
            {saving ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
