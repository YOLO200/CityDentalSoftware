import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Trash2, Upload, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { ConfirmDialog } from "./ConfirmDialog";

// Must match the bucket and the category CHECK in
// supabase/migrations/022_patient_notes_edit_and_documents.sql.
const BUCKET = "patient-files";

export const DOC_CATEGORIES = [
  { value: "documents", label: "Documents" },
  { value: "photos", label: "Photos" },
  { value: "xrays", label: "X-Rays" },
  { value: "lab_reports", label: "Lab Reports" },
  { value: "opg_ceph", label: "OPG/CEPH" },
  { value: "3d_files", label: "3D Files" },
  { value: "ortho_pre", label: "Ortho Pre Treatment" },
  { value: "consent", label: "Consent Form" },
] as const;

type Category = (typeof DOC_CATEGORIES)[number]["value"];

const CATEGORY_LABEL = Object.fromEntries(DOC_CATEGORIES.map((c) => [c.value, c.label])) as Record<string, string>;

// The bucket enforces the same list and limit server-side; checking here just
// gives a clear message instead of a storage error.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";
const MAX_BYTES = 20 * 1024 * 1024;

/** Signed URLs are short-lived on purpose — these are medical records. */
const URL_TTL_SECONDS = 60 * 60;

interface DocRow {
  id: string;
  category: Category;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface Doc extends DocRow {
  url: string | null;
}

interface PendingUpload {
  key: string;
  name: string;
  error: string | null;
}

const isImage = (d: { mime_type: string | null }) => !!d.mime_type?.startsWith("image/");

function extensionOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type === "application/pdf" ? "pdf" : "jpg";
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function DocumentsTab({ patientId }: { patientId: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<Category>("photos");
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await supabase
      .from("patient_documents")
      .select("id, category, file_path, file_name, mime_type, size_bytes, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(
        error.code === "PGRST205"
          ? "Document storage isn't set up yet — run supabase/migrations/022_patient_notes_edit_and_documents.sql."
          : error.message,
      );
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as DocRow[];
    const urls = new Map<string, string>();
    if (rows.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(rows.map((r) => r.file_path), URL_TTL_SECONDS);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    setDocs(rows.map((r) => ({ ...r, url: urls.get(r.file_path) ?? null })));
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  // Picking a folder tab also makes it the destination for the next upload.
  const selectFilter = (f: Category | "all") => {
    setFilter(f);
    if (f !== "all") setUploadCategory(f);
  };

  const uploadOne = async (file: File, category: Category): Promise<string | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Only JPG, PNG, WEBP or PDF files can be uploaded.";
    if (file.size > MAX_BYTES) return "File is larger than 20 MB.";

    // First path segment is the patient id — the storage policies read it to
    // decide who may see the file.
    const path = `${patientId}/${crypto.randomUUID()}.${extensionOf(file)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return upErr.message;

    const { error: rowErr } = await supabase.from("patient_documents").insert({
      patient_id: patientId,
      category,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (rowErr) {
      // Don't leave an orphaned file no row points at.
      await supabase.storage.from(BUCKET).remove([path]);
      return rowErr.message;
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const category = uploadCategory;
    const batch = list.map((f) => ({ key: crypto.randomUUID(), name: f.name, error: null as string | null }));
    setPending((p) => [...p, ...batch]);

    await Promise.all(
      list.map(async (file, i) => {
        const err = await uploadOne(file, category);
        setPending((p) =>
          err
            ? p.map((u) => (u.key === batch[i].key ? { ...u, error: err } : u))
            : p.filter((u) => u.key !== batch[i].key),
        );
      }),
    );
    await load();
  };

  const handleDelete = async (doc: Doc): Promise<string | null> => {
    // Row first: RLS reports a forbidden delete as zero rows, and we only want
    // to remove the file once the record is really gone.
    const { data, error } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", doc.id)
      .select("id");
    if (error) return error.message;
    if (!data || data.length === 0) return "You don't have permission to delete this file.";

    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    if (viewing?.id === doc.id) setViewing(null);
    return null;
  };

  // A cross-origin <a download> is ignored by browsers, so ask storage for a
  // URL that is served with Content-Disposition: attachment instead.
  const handleDownload = async (doc: Doc) => {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60, { download: doc.file_name });
    if (data?.signedUrl) window.location.assign(data.signedUrl);
  };

  const counts = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});
  const visible = filter === "all" ? docs : docs.filter((d) => d.category === filter);
  const busy = pending.some((p) => p.error === null);

  return (
    <div className="px-5 py-4">
      {/* Folder tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3">
        {([{ value: "all", label: "All" }, ...DOC_CATEGORIES] as { value: Category | "all"; label: string }[]).map((t) => {
          const n = t.value === "all" ? docs.length : counts[t.value] ?? 0;
          return (
            <button
              key={t.value}
              onClick={() => selectFilter(t.value)}
              className={`flex-shrink-0 rounded px-3 py-1.5 text-xs ${
                filter === t.value
                  ? "border-b-2 border-[#1e2d5a] font-semibold text-[#1e2d5a]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {n > 0 && <span className="ml-1 text-gray-400">({n})</span>}
            </button>
          );
        })}
      </div>

      {/* Upload controls */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Upload to
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as Category)}
            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400"
          >
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={!!loadError}
          className="flex items-center gap-1.5 rounded bg-[#1e2d5a] px-3 py-1.5 text-xs text-white hover:bg-[#162048] disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {pending.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {pending.map((u) => (
            <li
              key={u.key}
              className={`flex items-center justify-between rounded border px-3 py-2 text-xs ${
                u.error ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"
              }`}
            >
              <span className="truncate">
                {u.name} — {u.error ?? "uploading…"}
              </span>
              {u.error && (
                <button
                  onClick={() => setPending((p) => p.filter((x) => x.key !== u.key))}
                  aria-label="Dismiss"
                  className="ml-2 flex-shrink-0 rounded p-0.5 hover:bg-red-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone + grid */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!loadError) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!loadError) handleFiles(e.dataTransfer.files);
        }}
        className={`min-h-[240px] rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200"
        }`}
      >
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1 text-center text-sm text-gray-400">
            <Upload className="h-6 w-6" />
            <span>
              {filter === "all" ? "No documents uploaded yet." : `Nothing in ${CATEGORY_LABEL[filter]} yet.`}
            </span>
            <span className="text-xs">Drag JPG, PNG or PDF files here, or use Upload.</span>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((d) => (
              <li key={d.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setViewing(d)}
                  className="block aspect-square w-full bg-gray-50"
                  aria-label={`Open ${d.file_name}`}
                >
                  {isImage(d) && d.url ? (
                    <img src={d.url} alt={d.file_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                      <FileText className="h-10 w-10" />
                      <span className="text-[10px] uppercase">{d.mime_type === "application/pdf" ? "PDF" : "File"}</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setDeleting(d)}
                  aria-label={`Delete ${d.file_name}`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-gray-500 opacity-0 shadow transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="px-2 py-1.5">
                  <div className="truncate text-xs text-gray-700" title={d.file_name}>{d.file_name}</div>
                  <div className="text-[10px] text-gray-400">
                    {CATEGORY_LABEL[d.category]} · {formatDate(d.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Viewer */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80"
          onClick={() => setViewing(null)}
          role="presentation"
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-white" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              <div className="truncate">{viewing.file_name}</div>
              <div className="text-xs text-white/60">
                {CATEGORY_LABEL[viewing.category]} · {formatDate(viewing.created_at)}
                {viewing.size_bytes ? ` · ${formatSize(viewing.size_bytes)}` : ""}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {viewing.url && (
                <>
                  <a href={viewing.url} target="_blank" rel="noreferrer" aria-label="Open in new tab" className="rounded p-2 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => handleDownload(viewing)} aria-label="Download" className="rounded p-2 hover:bg-white/10">
                    <Download className="h-4 w-4" />
                  </button>
                </>
              )}
              <button onClick={() => setDeleting(viewing)} aria-label="Delete" className="rounded p-2 hover:bg-white/10">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewing(null)} aria-label="Close" className="rounded p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
            {!viewing.url ? (
              <span className="text-sm text-white/70">This file could not be loaded.</span>
            ) : isImage(viewing) ? (
              <img
                src={viewing.url}
                alt={viewing.file_name}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={viewing.url}
                title={viewing.file_name}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-full max-w-4xl rounded bg-white"
              />
            )}
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete file?"
          message={`"${deleting.file_name}" will be permanently removed from this patient's record.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
