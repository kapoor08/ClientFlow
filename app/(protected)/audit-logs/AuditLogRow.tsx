import { FileCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Action badge ─────────────────────────────────────────────────────────────

export function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-foreground">
      <FileCode size={10} />
      {action}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-32 rounded-full" /></td>
      <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-20" /></td>
      <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-3 w-24" /></td>
      <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-3 w-40" /></td>
    </tr>
  );
}

// ─── AuditLogRow ──────────────────────────────────────────────────────────────

type AuditLogEntry = {
  id: string;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export function AuditLogRow({ entry: e }: { entry: AuditLogEntry }) {
  return (
    <tr
      key={e.id}
      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
    >
      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
        {formatDate(e.createdAt)}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground leading-tight">
          {e.actorName ?? "System"}
        </p>
        {e.actorEmail && (
          <p className="text-xs text-muted-foreground">{e.actorEmail}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <ActionBadge action={e.action} />
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground font-mono md:table-cell">
        {e.entityType}
        {e.entityId && (
          <span className="ml-1 text-muted-foreground/60">
            :{e.entityId.slice(0, 8)}…
          </span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground font-mono lg:table-cell">
        {e.ipAddress ?? "—"}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell max-w-xs truncate">
        {e.userAgent ?? "—"}
      </td>
    </tr>
  );
}
