import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getSupportTicket } from "@/server/support";
import { TicketThread } from "@/components/support";
import { StatusBadge } from "@/components/shared/StatusBadge";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-info/10 text-info",
  in_progress: "bg-brand-100 text-primary",
  waiting_on_user: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-secondary text-muted-foreground",
};

export default async function PortalTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const ticket = await getSupportTicket(id, ctx.organizationId);
  if (!ticket) notFound();

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="max-w-2xl">
      <Link
        href="/client-portal/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to tickets
      </Link>

      <div className="mb-6">
        <div className="flex items-start gap-3">
          <h1 className="min-w-0 flex-1 font-display text-xl font-semibold text-foreground">
            {ticket.subject}
          </h1>
          <StatusBadge
            status={ticket.status.replace(/_/g, " ")}
            colorMap={STATUS_STYLES}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Opened {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })} •{" "}
          {ticket.category.replace(/_/g, " ")} •{" "}
          <span className="capitalize">{ticket.priority}</span> priority
        </p>
      </div>

      {/* Original description */}
      <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-cf-1">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">Original message</p>
        <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Thread with SSE */}
      <TicketThread
        ticketId={ticket.id}
        initialMessages={ticket.messages}
        isClosed={isClosed}
      />
    </div>
  );
}
