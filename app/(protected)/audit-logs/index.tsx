"use client";

import { useState } from "react";
import { Search, FileCode, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/core/audit/useCase";
import { useDebounce } from "@/hooks/use-debounce";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-foreground">
      <FileCode size={10} />
      {action}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const AuditLogsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAuditLogs({
    q: debouncedSearch || undefined,
    page,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Security-grade immutable action trail
        </p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search by action, actor, or entity…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Action
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Entity
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                IP
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground xl:table-cell">
                User Agent
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? "No audit events match your search."
                    : "No audit events recorded yet."}
                </td>
              </tr>
            ) : (
              logs.map((e) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount} ({pagination.total} events)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
