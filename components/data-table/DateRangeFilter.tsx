"use client";

import { useTransition } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { DateRangePicker } from "@/components/extended/date-range-picker";

export function DateRangeFilter() {
  const [, startTransition] = useTransition();

  const [{ dateFrom, dateTo }, setParams] = useQueryStates(
    {
      dateFrom: parseAsString.withDefault(""),
      dateTo: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(dateTo) : undefined;

  return (
    <DateRangePicker
      key={`${dateFrom}|${dateTo}`}
      initialDateFrom={from}
      initialDateTo={to}
      disableFutureDates
      onUpdate={({ range }) => {
        setParams({
          dateFrom: range.from ? range.from.toISOString() : null,
          dateTo: range.to ? range.to.toISOString() : null,
          page: null,
        });
      }}
    />
  );
}
