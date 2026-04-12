"use client";

import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";

export interface ControlledCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  description?: string;
  disabled?: boolean;
  error?: FieldError;
  className?: string;
}

export const ControlledCheckbox = <T extends FieldValues>({
  name,
  label,
  control,
  description,
  disabled = false,
  error,
  className,
}: ControlledCheckboxProps<T>) => {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={name}
              checked={field.value || false}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={name}
                className={`text-xs ${
                  disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
              >
                {label}
              </Label>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        )}
      />
      {error && (
        <p className="text-xs text-destructive mt-1">{error.message}</p>
      )}
    </div>
  );
};
