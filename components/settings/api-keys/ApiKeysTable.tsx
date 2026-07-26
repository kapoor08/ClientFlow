"use client";

import { Ban, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ApiKeyItem } from "./types";

type ApiKeysTableProps = {
  keys: ApiKeyItem[];
  isLoading: boolean;
  onRevoke: (key: ApiKeyItem) => void;
  onDelete: (key: ApiKeyItem) => void;
};

export function ApiKeysTable({ keys, isLoading, onRevoke, onDelete }: ApiKeysTableProps) {
  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 overflow-hidden border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border bg-secondary/50 border-b">
            <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
              Name
            </th>
            <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
              Prefix
            </th>
            <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold sm:table-cell">
              Status
            </th>
            <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold md:table-cell">
              Created
            </th>
            <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold lg:table-cell">
              Last used
            </th>
            <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold lg:table-cell">
              Calls (this month)
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-border border-b last:border-0">
                <td colSpan={7} className="px-4 py-3">
                  <div className="bg-secondary h-3 w-full animate-pulse rounded" />
                </td>
              </tr>
            ))
          ) : keys.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-muted-foreground px-4 py-12 text-center text-sm">
                No API keys yet. Create one to get started.
              </td>
            </tr>
          ) : (
            keys.map((k) => (
              <tr
                key={k.id}
                className="border-border hover:bg-secondary/20 border-b transition-colors last:border-0"
              >
                <td className="text-foreground px-4 py-3 font-medium">{k.name}</td>
                <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                  {k.keyPrefix}…
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span
                    className={`rounded-pill inline-flex px-2 py-0.5 text-xs font-medium ${k.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                  >
                    {k.revokedAt
                      ? "Revoked"
                      : k.expiresAt && new Date(k.expiresAt) < new Date()
                        ? "Expired"
                        : "Active"}
                  </span>
                </td>
                <td className="text-muted-foreground hidden px-4 py-3 text-xs md:table-cell">
                  {formatDistanceToNow(new Date(k.createdAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="text-muted-foreground hidden px-4 py-3 text-xs lg:table-cell">
                  {k.lastUsedAt
                    ? formatDistanceToNow(new Date(k.lastUsedAt), {
                        addSuffix: true,
                      })
                    : "Never"}
                </td>
                <td className="text-muted-foreground hidden px-4 py-3 text-xs tabular-nums lg:table-cell">
                  {k.monthlyUsage.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <TooltipProvider delayDuration={300}>
                    <div className="flex items-center justify-end gap-1">
                      {k.isActive && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-warning h-7 w-7 cursor-pointer"
                              onClick={() => onRevoke(k)}
                            >
                              <Ban size={13} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Revoke</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger h-7 w-7 cursor-pointer"
                            onClick={() => onDelete(k)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
