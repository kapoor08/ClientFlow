"use client";

import { useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { DateRangeFilter, FiltersPopover } from "@/components/data-table";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function FilterBar({ clients }: { clients: ClientOption[] }) {
  const [, startTransition] = useTransition();

  const opts = { shallow: false, startTransition, clearOnDefault: true };

  const [clientId, setClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault("").withOptions(opts),
  );

  const [priority, setPriority] = useQueryState(
    "priority",
    parseAsString.withDefault("").withOptions(opts),
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <DateRangeFilter />
      <FiltersPopover
        filters={[
          {
            key: "clientId",
            label: "Client",
            options: clients.map((c) => ({
              value: c.id,
              label: c.company ? `${c.name} (${c.company})` : c.name,
            })),
            value: clientId,
            onChange: (value) => setClientId(value || null),
          },
          {
            key: "priority",
            label: "Priority",
            options: PRIORITY_OPTIONS,
            value: priority,
            onChange: (value) => setPriority(value || null),
          },
        ]}
      />
    </div>
  );
}
