import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

export function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl">{value}</h3>
          {change && (
            <p
              className={`mt-2 text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
