"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import {
  adminReplyAction,
  updateTicketStatusAction,
  assignTicketAction,
} from "@/server/actions/admin/support";
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

const STATUS_OPTIONS = ["open", "in_progress", "waiting_on_user", "resolved", "closed"];

function SlaStatus({ ticket }: { ticket: DetailType }) {
  const { firstResponseDueAt, firstRespondedAt, resolutionDueAt, resolvedAt } = ticket;
  const now = new Date();

  const items = [
    {
      label: "First response",
      dueAt: firstResponseDueAt,
      metAt: firstRespondedAt,
    },
    {
      label: "Resolution",
      dueAt: resolutionDueAt,
      metAt: resolvedAt,
    },
  ];

  return (
    <div className="space-y-1.5">
      {items.map(({ label, dueAt, metAt }) => {
        if (!dueAt) return null;
        const due = new Date(dueAt);
        const met = metAt ? new Date(metAt) : null;
        const isBreached = !met && now > due;
        const isAtRisk = !met && !isBreached && due.getTime() - now.getTime() < 30 * 60_000;
        const status = met ? "met" : isBreached ? "breached" : isAtRisk ? "at-risk" : "ok";
        const color =
          status === "met"
            ? "text-success"
            : status === "breached"
              ? "text-danger"
              : status === "at-risk"
                ? "text-warning"
                : "text-muted-foreground";
        return (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={`text-xs font-medium ${color}`}>
              {status === "met"
                ? "Met"
                : status === "breached"
                  ? "Breached"
                  : status === "at-risk"
                    ? "At risk"
                    : formatDistanceToNow(due, { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type Props = { detail: DetailType; adminOptions: { id: string; name: string }[] };

export function AdminTicketDetail({ detail, adminOptions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  function handleReply() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await adminReplyAction({ ticketId: detail.id, body, isInternal });
      if (result.error) {
        toast.error(result.error);
      } else {
        setBody("");
        toast.success(isInternal ? "Internal note added." : "Reply sent.");
      }
    });
  }

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateTicketStatusAction({ ticketId: detail.id, status });
      if (result.error) toast.error(result.error);
    });
  }

  function handleAssign(adminUserId: string) {
    startTransition(async () => {
      const result = await assignTicketAction({
        ticketId: detail.id,
        adminUserId: adminUserId || null,
      });
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Main thread */}
      <div className="space-y-4">
        {/* Description */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {detail.createdByName ?? "Unknown"} •{" "}
                {formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })}
              </p>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Original
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{detail.description}</p>
        </div>

        {/* Messages */}
        {detail.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-5 shadow-cf-1 ${
              msg.isInternal
                ? "border-warning/30 bg-warning/5"
                : msg.authorRole === "admin"
                  ? "border-primary/20 bg-brand-100/30"
                  : "border-border bg-card"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {msg.authorName ?? "Unknown"}
              </p>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  msg.authorRole === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {msg.authorRole === "admin" ? "Support" : "User"}
              </span>
              {msg.isInternal && (
                <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning">
                  <Lock size={9} />
                  Internal
                </span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}

        {/* Reply form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {isInternal ? "Internal note" : "Reply to user"}
            </p>
            <button
              onClick={() => setIsInternal((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isInternal
                  ? "bg-warning/10 text-warning"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <Lock size={10} />
              {isInternal ? "Internal" : "Make internal"}
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleReply}
              disabled={isPending || !body.trim()}
              size="sm"
              className="gap-1.5"
            >
              <Send size={13} />
              {isPending ? "Sending…" : isInternal ? "Add note" : "Send reply"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status & Priority */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={isPending}
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  detail.status === s
                    ? (STATUS_COLORS[s] ?? "bg-secondary text-muted-foreground")
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Priority
          </p>
          <StatusBadge status={detail.priority} colorMap={PRIORITY_COLORS} />
        </div>

        {/* Assignment */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Assigned to
          </p>
          <select
            value={detail.assignedAdminId ?? ""}
            onChange={(e) => handleAssign(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Unassigned</option>
            {adminOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Details
          </p>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Org</span>
            <span className="text-xs font-medium text-foreground">{detail.orgName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Category</span>
            <span className="text-xs font-medium text-foreground capitalize">
              {detail.category.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Opened</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(detail.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          {detail.escalationLevel > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Escalation</span>
              <span className="text-xs font-semibold text-danger">
                Level {detail.escalationLevel}
              </span>
            </div>
          )}
        </div>

        {/* SLA */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SLA
          </p>
          <SlaStatus ticket={detail} />
        </div>

        {/* Event log */}
        {detail.events.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-cf-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Activity
            </p>
            <div className="space-y-2">
              {detail.events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {ev.actorName ?? "System"}
                      </span>{" "}
                      {ev.eventType.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
