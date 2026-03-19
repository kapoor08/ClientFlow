"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ControlledDatePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  error?: FieldError;
  placeholder?: string;
  position?: "bottom" | "top" | "right" | "left" | undefined;
  disabled?: boolean;
  disableFutureDates?: boolean; // <-- NEW PROP
};

export function ControlledDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  error,
  placeholder = "Pick a date",
  position = "top",
  disabled = false,
  disableFutureDates = false, // default = false
}: ControlledDatePickerProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label htmlFor={name}>{label}</Label>}

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={`w-full justify-start text-left font-normal cursor-pointer ${
                  !field.value ? "text-muted-foreground" : ""
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(field.value as Date, "PPP")
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto p-0"
              side={position}
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date) => field.onChange(date)}
                autoFocus
                disabled={
                  disableFutureDates
                    ? (date) => date > new Date() // disable future dates
                    : undefined
                }
              />
            </PopoverContent>
          </Popover>
        )}
      />

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
