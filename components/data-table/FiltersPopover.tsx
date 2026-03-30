"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterGroupConfig = {
  key: string;
  label: string;
  options: FilterOption[];
  /** Current selected value. Empty string means no filter applied ("All"). */
  value: string;
  onChange: (value: string) => void;
};

type FiltersPopoverProps = {
  filters: FilterGroupConfig[];
};

export function FiltersPopover({ filters }: FiltersPopoverProps) {
  const [open, setOpen] = useState(false);

  const activeCount = filters.filter((f) => f.value !== "").length;

  function clearAll() {
    filters.forEach((f) => f.onChange(""));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-1.5 border-border bg-white text-sm font-normal cursor-pointer",
            activeCount > 0 && "border-primary text-primary",
          )}
        >
          <Filter size={14} className="shrink-0" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-52 overflow-hidden p-0"
        align="end"
        sideOffset={6}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Filters</span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>

        {/* Filter groups */}
        <div className="p-2 space-y-3">
          {filters.map((filter) => (
            <div key={filter.key}>
              <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {filter.label}
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => filter.onChange("")}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                    filter.value === ""
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  All
                </button>
                {filter.options.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() =>
                      filter.onChange(
                        opt.value === filter.value ? "" : opt.value,
                      )
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                      filter.value === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
