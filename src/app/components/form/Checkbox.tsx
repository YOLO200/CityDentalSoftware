interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-border bg-input-background transition-all checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          {...props}
        />
        <svg
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
        {label}
      </span>
    </label>
  );
}
