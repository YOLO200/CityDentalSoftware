interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Textarea({ label, error, required, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
          error ? "border-destructive" : ""
        } ${className}`}
        rows={4}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
