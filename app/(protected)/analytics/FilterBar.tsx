"use client";

import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { DATE_PRESET_OPTIONS } from "@/core/analytics/entity";
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

export function FilterBar() {
  const [, startTransition] = useTransition();

  const [{ datePreset, clientId }, setParams] = useQueryStates(
    {
      datePreset: parseAsString.withDefault("6m"),
      clientId: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  const { data: clientsData } = useQuery({
    queryKey: clientKeys.list({ pageSize: 500 }),
    queryFn: () => listClients({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const clientOptions = clientsData?.clients ?? [];
  const isDirty = datePreset !== "6m" || !!clientId;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <div className="mr-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter size={14} />
        <span className="font-medium">Filters</span>
      </div>

      {/* Date range preset */}
      <Select
        value={datePreset}
        onValueChange={(val) => setParams({ datePreset: val, clientId: clientId || null })}
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
        value={clientId || "__all__"}
        onValueChange={(val) =>
          setParams({
            datePreset: datePreset || null,
            clientId: val === "__all__" ? null : val,
          })
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
          onClick={() => setParams({ datePreset: null, clientId: null })}
          className="h-7 gap-1 text-muted-foreground"
        >
          <X size={12} />
          Reset
        </Button>
      )}
    </div>
  );
}
