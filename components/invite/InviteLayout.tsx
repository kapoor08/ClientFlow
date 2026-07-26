import { Building2 } from "lucide-react";

export function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 flex items-center gap-2">
        <Building2 size={24} className="text-primary" />
        <span className="font-display text-foreground text-xl font-semibold">ClientFlow</span>
      </div>
      {children}
    </div>
  );
}

export function StatusCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border-border bg-card shadow-cf-2 w-full max-w-md border p-8 text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h1 className="font-display text-foreground mb-2 text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
