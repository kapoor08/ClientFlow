"use client";

import type { Control, FieldError, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface ControlledDateRangePickerProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  control: Control<T>;
  error?: FieldError;
  disabled?: boolean;
  description?: string;
  showCompare?: boolean;
  align?: "start" | "center" | "end";
  fullMonthMode?: boolean;
  /** When true, future dates are disabled in the calendar */
  disableFutureDates?: boolean;
  /** When true, past dates are disabled in the calendar */
  disablePastDates?: boolean;
}

export const ControlledDateRangePicker = <T extends FieldValues>({
  name,
  label,
  control,
  error,
  disabled = false,
  description,
  showCompare = false,
  align = "start",
  fullMonthMode = false,
  disableFutureDates = false,
  disablePastDates = false,
}: ControlledDateRangePickerProps<T>) => {
  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value = field.value as DateRange | undefined;

          return (
            <DateRangePicker
              {...(value?.from && { initialDateFrom: value.from })}
              {...(value?.to && { initialDateTo: value.to })}
              onUpdate={(values) => {
                field.onChange(values.range);
              }}
              showCompare={showCompare}
              align={align}
              fullMonthMode={fullMonthMode}
              disableFutureDates={disableFutureDates}
              disablePastDates={disablePastDates}
            />
          );
        }}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};
