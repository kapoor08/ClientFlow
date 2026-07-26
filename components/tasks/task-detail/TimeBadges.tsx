"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime, formatTimeAgo } from "@/utils/date";

/** Renders a relative timestamp that re-evaluates every 30 s. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className={className}>{formatTimeAgo(iso)}</span>;
}

/** "edited" label with a tooltip showing the exact edit time. */
export function EditedBadge({ updatedAt }: { updatedAt: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-[10px] text-muted-foreground/50 italic leading-none cursor-default">
            edited
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>Edited {formatDateTime(updatedAt)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
