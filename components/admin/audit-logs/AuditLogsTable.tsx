"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import {
  DataTable,
  DateRangeFilter,
  FiltersPopover,
  type ColumnDef,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminAuditLogRow } from "@/server/admin/audit-logs";
import type { PaginationMeta } from "@/utils/pagination";

const ENTITY_TYPE_OPTIONS = [
  { value: "organization", label: "Organization" },
  { value: "user", label: "User" },
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "client", label: "Client" },
  { value: "invoice", label: "Invoice" },
  { value: "api_key", label: "API Key" },
  { value: "webhook", label: "Webhook" },
];

const columns: ColumnDef<AdminAuditLogRow>[] = [
  {
    key: "action",
    header: "Action",
    cell: (log) => (
      <>
        <p className="text-foreground font-mono text-xs font-medium">{log.action}</p>
        <p className="text-muted-foreground text-[10px]">
          {log.entityType}
          {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
        </p>
      </>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    hideOnMobile: true,
    cell: (log) =>
      log.actorName ? (
        <>
          <p className="text-foreground text-sm">{log.actorName}</p>
          <p className="text-muted-foreground text-xs">{log.actorEmail}</p>
        </>
      ) : (
        <span className="text-muted-foreground text-xs">System</span>
      ),
  },
  {
    key: "orgName",
    header: "Organization",
    hideOnTablet: true,
    cell: (log) => <span className="text-muted-foreground text-sm">{log.orgName ?? "-"}</span>,
  },
  {
    key: "ipAddress",
    header: "IP",
    hideOnMobile: true,
    cell: (log) => (
      <span className="text-muted-foreground font-mono text-xs">{log.ipAddress ?? "-"}</span>
    ),
  },
  {
    key: "createdAt",
    header: "When",
    cell: (log) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
      </span>
    ),
  },
];

type Props = {
  data: AdminAuditLogRow[];
  pagination: PaginationMeta;
};

export function AuditLogsTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const [{ entityType, actor }, setFilters] = useQueryStates(
    {
      entityType: parseAsString.withDefault(""),
      actor: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  // Local state for the actor input so typing doesn't refetch on every keystroke
  // - debounce to the URL after 400ms of stillness. The sync-from-URL effect
  // covers external URL changes (browser back/forward, link navigation); during
  // active typing the local state diverges from the URL until the debounce fires.
  const [actorDraft, setActorDraft] = useState(actor);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setActorDraft(actor), [actor]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (actorDraft !== actor) {
        setFilters({ actor: actorDraft || null, page: null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [actorDraft, actor, setFilters]);

  // Build export URL that preserves the current filters
  const exportUrl = (() => {
    const url = new URL("/api/admin/audit-logs/export", "http://_");
    const q = searchParams.get("q");
    const et = searchParams.get("entityType");
    const ac = searchParams.get("actor");
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");
    if (q) url.searchParams.set("q", q);
    if (et) url.searchParams.set("entityType", et);
    if (ac) url.searchParams.set("actor", ac);
    if (from) url.searchParams.set("dateFrom", from);
    if (to) url.searchParams.set("dateTo", to);
    return url.pathname + (url.search || "");
  })();

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search action, entity type, or entity ID…"
      searchExtra={
        <>
          <Input
            placeholder="Filter by actor (name or email)"
            value={actorDraft}
            onChange={(e) => setActorDraft(e.target.value)}
            className="h-9 w-56 text-xs"
          />
          <DateRangeFilter />
          <FiltersPopover
            filters={[
              {
                key: "entityType",
                label: "Entity Type",
                options: ENTITY_TYPE_OPTIONS,
                value: entityType,
                onChange: (v) => setFilters({ entityType: v || null, page: null }),
              },
            ]}
          />
          <Button variant="outline" size="sm" asChild className="cursor-pointer gap-1.5">
            <a href={exportUrl} download>
              <Download size={13} />
              Export CSV
            </a>
          </Button>
        </>
      }
      pagination={pagination}
      emptyTitle="No audit logs found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
