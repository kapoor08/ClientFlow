"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { processContactSubmissionAction } from "@/server/actions/admin/support";
import type { AdminContactSubmissionRow } from "@/server/admin/support";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-info/10 text-info",
  processed: "bg-success/10 text-success",
  spam: "bg-secondary text-muted-foreground",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "processed", label: "Processed" },
  { value: "spam", label: "Spam" },
];

function MarkProcessedButton({ row }: { row: AdminContactSubmissionRow }) {
  const [isPending, startTransition] = useTransition();

  if (row.status !== "new") return null;

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await processContactSubmissionAction({ submissionId: row.id });
          if (result.error) toast.error(result.error);
          else toast.success("Marked as processed.");
        })
      }
      disabled={isPending}
      className="text-xs text-primary hover:underline disabled:opacity-50"
    >
      {isPending ? "Marking…" : "Mark processed"}
    </button>
  );
}

const columns: ColumnDef<AdminContactSubmissionRow>[] = [
  {
    key: "actions",
    header: "Actions",
    headerClassName: "w-24",
    cell: (r) => (
      <div className="flex">
        <MarkProcessedButton row={r} />
      </div>
    ),
  },
  {
    key: "name",
    header: "Name",
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground text-sm">{r.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{r.email}</p>
      </div>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    hideOnMobile: true,
    cell: (r) => <span className="text-sm text-foreground">{r.subject}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} colorMap={STATUS_COLORS} />,
  },
  {
    key: "createdAt",
    header: "Received",
    hideOnMobile: true,
    cell: (r) => (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
      </span>
    ),
  },
];

type Props = {
  data: AdminContactSubmissionRow[];
  pagination: PaginationMeta;
};

export function ContactSubmissionsTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();
  const [{ status }, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search by email…"
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
          ]}
        />
      }
      pagination={pagination}
      emptyTitle="No submissions found."
      emptyDescription="Contact form submissions will appear here."
    />
  );
}
