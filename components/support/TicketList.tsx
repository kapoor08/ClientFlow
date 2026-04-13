import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import type { PortalTicketRow } from "@/server/support";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-info/10 text-info",
  in_progress: "bg-brand-100 text-primary",
  waiting_on_user: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-secondary text-muted-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "text-danger font-semibold",
  high: "text-warning font-semibold",
  normal: "text-muted-foreground",
  low: "text-muted-foreground",
};

type Props = { tickets: PortalTicketRow[] };

export function TicketList({ tickets }: Props) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-10 text-center shadow-cf-1">
        <MessageSquare size={32} className="mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-foreground">No tickets yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a ticket to get help from our support team.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
      {tickets.map((t, i) => (
        <Link
          key={t.id}
          href={`/client-portal/support/${t.id}`}
          className={`flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors ${
            i > 0 ? "border-t border-border" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{t.subject}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.category.replace(/_/g, " ")} •{" "}
              <span className={PRIORITY_STYLES[t.priority] ?? "text-muted-foreground"}>
                {t.priority}
              </span>{" "}
              priority • {t.messageCount} repl{t.messageCount === 1 ? "y" : "ies"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                STATUS_STYLES[t.status] ?? "bg-secondary text-muted-foreground"
              }`}
            >
              {t.status.replace(/_/g, " ")}
            </span>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(t.lastActivityAt), { addSuffix: true })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
