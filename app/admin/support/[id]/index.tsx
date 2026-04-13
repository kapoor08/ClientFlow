import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminTicketDetail } from "@/components/admin/support";
import type { AdminTicketDetail as DetailType } from "@/server/admin/support";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-info/10 text-info",
  in_progress: "bg-brand-100 text-primary",
  waiting_on_user: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-secondary text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-danger/10 text-danger",
  high: "bg-warning/10 text-warning",
  normal: "bg-secondary text-muted-foreground",
  low: "bg-secondary text-muted-foreground",
};

type Props = {
  detail: DetailType;
  adminOptions: { id: string; name: string }[];
};

export default function AdminTicketPage({ detail, adminOptions }: Props) {
  return (
    <div>
      <Link
        href="/admin/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to tickets
      </Link>

      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{detail.subject}</h1>
            <p className="mt-1 text-xs text-muted-foreground font-mono">#{detail.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={detail.priority} colorMap={PRIORITY_COLORS} />
            <StatusBadge
              status={detail.status.replace(/_/g, " ")}
              colorMap={STATUS_COLORS}
            />
          </div>
        </div>
      </div>

      <AdminTicketDetail detail={detail} adminOptions={adminOptions} />
    </div>
  );
}
