import { Activity, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityEntry } from "@/core/activity/entity";
import { formatTimeAgo } from "@/utils/date";
import { getInitials } from "@/utils/user";
import {
  getActionLabel,
  getEntityName,
  getEntityBadgeStyle,
} from "@/core/activity/entity";
import { ENTITY_ICON, ENTITY_ICON_BG } from "@/constants/activity";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActorAvatar({ name }: { name: string | null }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-primary ring-2 ring-background">
      {getInitials(name)}
    </div>
  );
}

function EntityBadge({ entityType }: { entityType: string }) {
  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ${getEntityBadgeStyle(entityType)}`}
    >
      {entityType}
    </span>
  );
}

function EntityIconCircle({ entityType }: { entityType: string }) {
  const Icon = ENTITY_ICON[entityType] ?? Activity;
  const bg = ENTITY_ICON_BG[entityType] ?? "bg-secondary text-muted-foreground";
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}
    >
      <Icon size={15} strokeWidth={2} />
    </div>
  );
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────

type ActivityItemProps = { entry: ActivityEntry; isLast: boolean };

export function ActivityItem({ entry, isLast }: ActivityItemProps) {
  const actionLabel = getActionLabel(entry.action);
  const entityName = getEntityName(entry);
  const actorDisplay = entry.actorName ?? "System";

  return (
    <div className="relative flex gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
      {/* Timeline line - connects to next item */}
      {!isLast && (
        <div className="absolute left-[2.325rem] top-13 bottom-0 w-px bg-border" />
      )}

      {/* Entity icon */}
      <div className="relative z-10 mt-0.5">
        <EntityIconCircle entityType={entry.entityType} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Main line */}
          <p className="text-sm leading-snug text-foreground">
            <span className="font-semibold">{actorDisplay}</span>{" "}
            <span className="text-muted-foreground">{actionLabel}</span>
            {entityName && (
              <>
                {" "}
                <span className="font-medium">{entityName}</span>
              </>
            )}
          </p>

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <EntityBadge entityType={entry.entityType} />
            {entry.actorEmail && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {entry.actorEmail}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Timestamp + avatar cluster */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <ActorAvatar name={entry.actorName} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays size={11} />
              <span className="whitespace-nowrap">
                {formatTimeAgo(entry.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SkeletonItem ─────────────────────────────────────────────────────────────

export function SkeletonItem({ isLast }: { isLast: boolean }) {
  return (
    <div className="relative flex gap-4 px-5 py-4">
      {!isLast && (
        <div className="absolute left-[2.325rem] top-13 bottom-0 w-px bg-border" />
      )}
      <Skeleton className="relative z-10 mt-0.5 h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3.5 w-2/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
