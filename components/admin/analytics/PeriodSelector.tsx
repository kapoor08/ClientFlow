"use client";

import { useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { PERIOD_OPTIONS } from "@/schemas/admin/analytics";

export function PeriodSelector({ period }: { period: string }) {
  const [, startTransition] = useTransition();
  const [, setPeriod] = useQueryState(
    "period",
    parseAsString.withDefault("30").withOptions({ shallow: false, startTransition }),
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value === "30" ? null : opt.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            period === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
