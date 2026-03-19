"use client";

import type { Control, FieldError, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { DateTimePicker } from "@/components/form";
import { Label } from "@/components/ui/label";

interface ControlledDateTimePickerProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  control: Control<T>;
  placeholder?: string;
  error?: FieldError;
  disabled?: boolean;
  description?: string;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
}

export const ControlledDateTimePicker = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  error,
  disabled = false,
  description,
  disableFutureDates = false,
  disablePastDates = false,
}: ControlledDateTimePickerProps<T>) => {
  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DateTimePicker
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            placeholder={placeholder}
            disableFutureDates={disableFutureDates}
            disablePastDates={disablePastDates}
          />
        )}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};
