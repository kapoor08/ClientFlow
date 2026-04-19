"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { AdminTicketRow } from "@/server/admin/support";
import type { PaginationMeta } from "@/utils/pagination";

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

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_user", label: "Waiting on User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const CATEGORY_OPTIONS = [
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "general", label: "General" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
];

function SlaIndicator({ ticket }: { ticket: AdminTicketRow }) {
  if (!ticket.firstResponseDueAt || ticket.firstRespondedAt) return null;
  const now = new Date();
  const due = new Date(ticket.firstResponseDueAt);
  const isBreached = now > due;
  const isAtRisk = !isBreached && due.getTime() - now.getTime() < 30 * 60_000;
  if (!isBreached && !isAtRisk) return null;
  return (
    <span
      className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        isBreached ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
      }`}
    >
      {isBreached ? "SLA" : "⚠"}
    </span>
  );
}

const columns: ColumnDef<AdminTicketRow>[] = [
  {
    key: "actions",
    header: "Actions",
    headerClassName: "w-10",
    cell: (t) => (
      <Link
        href={`/admin/support/${t.id}`}
        className="flex items-center rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <ExternalLink size={13} />
      </Link>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    cell: (t) => (
      <div className="flex items-center gap-1 min-w-0">
        <span className="font-medium text-foreground truncate max-w-xs">{t.subject}</span>
        <SlaIndicator ticket={t} />
      </div>
    ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnMobile: true,
    cell: (t) => <span className="text-xs text-muted-foreground">{t.orgName}</span>,
  },
  {
    key: "priority",
    header: "Priority",
    hideOnMobile: true,
    cell: (t) => <StatusBadge status={t.priority} colorMap={PRIORITY_COLORS} />,
  },
  {
    key: "status",
    header: "Status",
    cell: (t) => <StatusBadge status={t.status.replace(/_/g, " ")} colorMap={STATUS_COLORS} />,
  },
  {
    key: "messageCount",
    header: "Replies",
    hideOnTablet: true,
    cell: (t) => <span className="text-xs text-muted-foreground">{t.messageCount}</span>,
  },
  {
    key: "lastActivityAt",
    header: "Last Activity",
    hideOnMobile: true,
    cell: (t) => (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(t.lastActivityAt), { addSuffix: true })}
      </span>
    ),
  },
];

type Props = {
  data: AdminTicketRow[];
  pagination: PaginationMeta;
};

export function SupportTicketsTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();
  const [{ status, priority, category }, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault(""),
      priority: parseAsString.withDefault(""),
      category: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(t) => t.id}
      searchPlaceholder="Search tickets…"
      searchExtra={
        <FiltersPopover
          filters={[
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              value: status,
              onChange: (v) => setFilters({ status: v || null, page: null }),
            },
            {
              key: "priority",
              label: "Priority",
              options: PRIORITY_OPTIONS,
              value: priority,
              onChange: (v) => setFilters({ priority: v || null, page: null }),
            },
            {
              key: "category",
              label: "Category",
              options: CATEGORY_OPTIONS,
              value: category,
              onChange: (v) => setFilters({ category: v || null, page: null }),
            },
          ]}
        />
      }
      pagination={pagination}
      emptyTitle="No tickets found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
