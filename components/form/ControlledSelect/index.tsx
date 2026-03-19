"use client";

import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ControlledSelectOption = {
  icon?: React.ReactNode;
  label: string;
  value: string;
};

export type ControlledSelectProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  options: ControlledSelectOption[];
  error?: FieldError;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  description?: string;
};

export function ControlledSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Select an option",
  options,
  error,
  disabled = false,
  onValueChange,
  description,
}: ControlledSelectProps<T>) {
  return (
    <div className="grid gap-2">
      {label && (
        <Label htmlFor={name} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground -mt-1">{description}</p>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Ensure value is a string and exists in options
          const currentValue = field.value ? String(field.value) : undefined;

          return (
            <Select
              key={currentValue || "empty"}
              onValueChange={(value) => {
                field.onChange(value);
                onValueChange?.(value);
              }}
              value={currentValue}
              defaultValue={currentValue}
              disabled={disabled}
            >
              <SelectTrigger
                id={name}
                className={`w-full cursor-pointer ${
                  error
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                aria-invalid={Boolean(error)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-h-75 overflow-y-auto"
              >
                {options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer aria-selected:bg-primary aria-selected:text-muted-foreground hover:text-foreground hover:bg-primary!"
                  >
                    {opt.icon} {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
