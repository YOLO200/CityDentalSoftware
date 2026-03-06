interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-blue-100">
        {title}
      </h2>
      {children}
    </div>
  );
}
