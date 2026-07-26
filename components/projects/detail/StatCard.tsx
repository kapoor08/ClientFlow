type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
};

export function StatCard({ icon, label, value, valueClassName }: StatCardProps) {
  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
      <div className="text-muted-foreground flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
      </div>
      <div className={`mt-2.5 text-sm font-semibold ${valueClassName ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
