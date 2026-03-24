"use client";

// Stub component — full date-range-picker implementation not used in this project

interface DateRange {
  from: Date;
  to?: Date;
}

interface DateRangePickerProps {
  initialDateFrom?: Date;
  initialDateTo?: Date;
  onUpdate?: (values: { range: DateRange }) => void;
  showCompare?: boolean;
  align?: "start" | "center" | "end";
  fullMonthMode?: boolean;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
}

export function DateRangePicker(_props: DateRangePickerProps) {
  return null;
}
