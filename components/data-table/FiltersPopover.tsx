"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";

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
        className="w-64 overflow-hidden p-0"
        align="end"
        sideOffset={6}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
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
        <div className="space-y-3 p-3 pt-0">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {filter.label}
              </p>
              <Select
                value={filter.value || "__all__"}
                onValueChange={(val) =>
                  filter.onChange(val === "__all__" ? "" : val)
                }
              >
                <SelectTrigger className="h-8 w-full text-sm cursor-pointer">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  className="p-2"
                  sideOffset={4}
                >
                  <SelectItem value="__all__">All</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
