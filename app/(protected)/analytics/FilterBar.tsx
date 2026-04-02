"use client";

import { useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  DateRangeFilter,
  FiltersPopover,
} from "@/components/data-table";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

export function FilterBar({ clients }: { clients: ClientOption[] }) {
  const [, startTransition] = useTransition();

  const [clientId, setClientId] = useQueryState(
    "clientId",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <DateRangeFilter />
      <FiltersPopover
        filters={[
          {
            key: "clientId",
            label: "Client",
            options: clients.map((client) => ({
              value: client.id,
              label: client.company
                ? `${client.name} (${client.company})`
                : client.name,
            })),
            value: clientId,
            onChange: (value) => setClientId(value || null),
          },
        ]}
      />
    </div>
  );
}
