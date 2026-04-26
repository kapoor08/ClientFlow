"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminWebhookDeliveryRow } from "@/server/admin/webhook-deliveries";
import type { PaginationMeta } from "@/utils/pagination";

const STATUS_OPTIONS = [
  { value: "exhausted", label: "Failed (replayable)" },
  { value: "permanent_fail", label: "Permanent failure" },
  { value: "delivered", label: "Delivered" },
  { value: "all", label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-success/10 text-success",
  exhausted: "bg-warning/10 text-warning",
  permanent_fail: "bg-destructive/10 text-destructive",
};

function ReplayButton({ deliveryId, status }: { deliveryId: string; status: string }) {
  const [pending, setPending] = useState(false);
  const canReplay = status === "exhausted";

  async function handleReplay() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/webhook-deliveries/${deliveryId}/replay`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Replay failed");
      }
      toast.success("Replay dispatched.");
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

const columns: ColumnDef<AdminWebhookDeliveryRow>[] = [
  {
    key: "createdAt",
    header: "When",
    cell: (d) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "webhookName",
    header: "Webhook",
    cell: (d) => (
      <>
        <p className="text-foreground text-sm font-medium">{d.webhookName}</p>
        <p className="text-muted-foreground max-w-[220px] truncate font-mono text-[10px]">
          {d.webhookUrl}
        </p>
      </>
    ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnMobile: true,
    cell: (d) => <span className="text-muted-foreground text-sm">{d.orgName}</span>,
  },
  {
    key: "event",
    header: "Event",
    cell: (d) => <span className="text-foreground font-mono text-xs">{d.event}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (d) => <StatusBadge status={d.status} colorMap={STATUS_COLORS} />,
  },
  {
    key: "attempts",
    header: "Attempts",
    hideOnMobile: true,
    cell: (d) => (
      <span className="text-muted-foreground text-xs">
        {d.attempts}
        {d.responseStatus ? ` · HTTP ${d.responseStatus}` : ""}
      </span>
    ),
  },
  {
    key: "error",
    header: "Error",
    hideOnTablet: true,
    cell: (d) => (
      <span className="text-muted-foreground block max-w-[260px] truncate text-xs">
        {d.error ?? "-"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    cell: (d) => <ReplayButton deliveryId={d.id} status={d.status} />,
  },
];

type Props = {
  data: AdminWebhookDeliveryRow[];
  pagination: PaginationMeta;
};

export function WebhookDeliveriesTable({ data, pagination }: Props) {
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
      emptyTitle="No deliveries found."
      emptyDescription="Failed webhook deliveries appear here for replay."
    />
  );
}
