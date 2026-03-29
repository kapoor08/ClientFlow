"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { useAnalytics, DEFAULT_FILTERS } from "@/core/analytics/useCase";
import {
  DATE_PRESET_OPTIONS,
  type AnalyticsFilters,
} from "@/core/analytics/entity";
import { listClients } from "@/core/clients/repository";
import { clientKeys } from "@/core/clients/useCase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type FilterBarProps = {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: clientsData } = useQuery({
    queryKey: clientKeys.list({ pageSize: 500 }),
    queryFn: () => listClients({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const clientOptions = clientsData?.clients ?? [];
  const isDirty =
    filters.datePreset !== DEFAULT_FILTERS.datePreset || !!filters.clientId;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
        <Filter size={14} />
        <span className="font-medium">Filters</span>
      </div>

      {/* Date range preset */}
      <Select
        value={filters.datePreset}
        onValueChange={(val) =>
          onChange({
            ...filters,
            datePreset: val as AnalyticsFilters["datePreset"],
          })
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {DATE_PRESET_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Client filter */}
      <Select
        value={filters.clientId || "__all__"}
        onValueChange={(val) =>
          onChange({ ...filters, clientId: val === "__all__" ? "" : val })
        }
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="__all__">All clients</SelectItem>
          {clientOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.company ? `${c.name} (${c.company})` : c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {isDirty && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="h-7 gap-1 text-muted-foreground"
        >
          <X size={12} />
          Reset
        </Button>
      )}
    </div>
  );
}
