"use client";

import { CalendarDays, Monitor, Network, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getActionLabel,
  getEntityBadgeStyle,
  getEntityName,
} from "@/core/activity/entity";
import type { ActivityEntry } from "@/core/activity/entity";
import { getInitials } from "@/utils/user";
import { formatMinutes } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { ENTITY_ICON, ENTITY_ICON_BG } from "@/helpers/activity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKIP_META_KEYS = new Set(["id", "entityId"]);

function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\bId\b/g, "")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (key === "minutes" && typeof value === "number")
    return formatMinutes(value);
  if (key === "amountCents" && typeof value === "number")
    return formatCurrency(value);
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function shouldShowMetaEntry(key: string, value: unknown): boolean {
  if (SKIP_META_KEYS.has(key)) return false;
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && UUID_RE.test(value)) return false;
  if (typeof value === "object" && !Array.isArray(value)) return false;
  return true;
}

// ─── ActivityDetailModal ──────────────────────────────────────────────────────

type Props = {
  entry: ActivityEntry | null;
  onClose: () => void;
};

export function ActivityDetailModal({ entry, onClose }: Props) {
  if (!entry) return null;

  const Icon = ENTITY_ICON[entry.entityType] ?? Activity;
  const iconBg =
    ENTITY_ICON_BG[entry.entityType] ?? "bg-secondary text-muted-foreground";
  const actionLabel = getActionLabel(entry.action);
  const entityName = getEntityName(entry);

  const metaEntries = entry.metadata
    ? Object.entries(entry.metadata).filter(([k, v]) =>
        shouldShowMetaEntry(k, v),
      )
    : [];

  const hasTechnical = !!(entry.ipAddress || entry.userAgent);

  return (
    <Dialog
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-tight text-foreground">
                  {actionLabel}
                </p>
                {entityName && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {entityName}
                  </p>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Timestamp */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 px-3.5 py-3">
            <CalendarDays
              size={14}
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Timestamp
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {formatFullDate(entry.createdAt)}
              </p>
            </div>
          </div>

          {/* Actor */}
          <div className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(entry.actorName)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {entry.actorName ?? "System"}
              </p>
              {entry.actorEmail && (
                <p className="text-xs text-muted-foreground">
                  {entry.actorEmail}
                </p>
              )}
            </div>
            <span
              className={`ml-auto rounded-pill px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ${getEntityBadgeStyle(entry.entityType)}`}
            >
              {entry.entityType.replace("_", " ")}
            </span>
          </div>

          {/* Metadata details */}
          {metaEntries.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-secondary/40 px-3.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Details
                </p>
              </div>
              {metaEntries.map(([key, value], i) => (
                <div
                  key={key}
                  className={`flex items-start gap-3 px-3.5 py-2.5 ${
                    i < metaEntries.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {formatKey(key)}
                  </span>
                  <span className="flex-1 break-words text-xs font-medium text-foreground">
                    {formatValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Technical - IP + User Agent */}
          {hasTechnical && (
            <div className="space-y-2 rounded-lg border border-border bg-secondary/20 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Technical
              </p>
              {entry.ipAddress && (
                <div className="flex items-center gap-2">
                  <Network
                    size={11}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.ipAddress}
                  </span>
                </div>
              )}
              {entry.userAgent && (
                <div className="flex items-start gap-2">
                  <Monitor
                    size={11}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <span className="break-all text-xs text-muted-foreground">
                    {entry.userAgent}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
