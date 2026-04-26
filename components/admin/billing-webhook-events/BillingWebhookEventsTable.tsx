"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { BillingWebhookEventRow } from "@/server/admin/billing-webhook-events";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "failed", label: "Failed (replayable)" },
  { value: "processed", label: "Processed" },
  { value: "all", label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  processed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
};

function statusOf(row: BillingWebhookEventRow): string {
  if (row.processingError) return "failed";
  if (row.processedAt) return "processed";
  return "pending";
}

function ReplayButton({ rowId, status }: { rowId: string; status: string }) {
  const [pending, setPending] = useState(false);
  const canReplay = status !== "processed";

  async function handleReplay() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/billing-webhook-events/${rowId}/replay`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Replay failed");
      }
      toast.success("Replay succeeded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replay failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!canReplay || pending}
      onClick={handleReplay}
      className="cursor-pointer"
    >
      <RefreshCw size={12} className="mr-1.5" />
      {pending ? "Replaying…" : "Replay"}
    </Button>
  );
}

const columns: ColumnDef<BillingWebhookEventRow>[] = [
  {
    key: "receivedAt",
    header: "When",
    cell: (e) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDistanceToNow(new Date(e.receivedAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "eventType",
    header: "Event",
    cell: (e) => (
      <>
        <p className="text-foreground font-mono text-xs">{e.eventType}</p>
        <p className="text-muted-foreground max-w-[260px] truncate font-mono text-[10px]">
          {e.eventId}
        </p>
      </>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (e) => <StatusBadge status={statusOf(e)} colorMap={STATUS_COLORS} />,
  },
  {
    key: "error",
    header: "Error",
    hideOnTablet: true,
    cell: (e) => (
      <span className="text-muted-foreground block max-w-[320px] truncate text-xs">
        {e.processingError ?? "-"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    cell: (e) => <ReplayButton rowId={e.id} status={statusOf(e)} />,
  },
];

type Props = {
  data: BillingWebhookEventRow[];
  pagination: PaginationMeta;
};

export function BillingWebhookEventsTable({ data, pagination }: Props) {
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
      getRowKey={(row) => row.id}
      searchPlaceholder=""
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
      emptyTitle="No events found."
      emptyDescription="Failed Stripe webhook events appear here for replay."
    />
  );
}
