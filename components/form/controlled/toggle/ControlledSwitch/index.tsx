"use client";

import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface ControlledSwitchProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  description?: string;
  disabled?: boolean;
  error?: FieldError;
  className?: string;
}

export const ControlledSwitch = <T extends FieldValues>({
  name,
  label,
  control,
  description,
  disabled = false,
  error,
  className,
}: ControlledSwitchProps<T>) => {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Convert string values ("No", "false", "0", "") to proper boolean
          const toBool = (v: unknown): boolean => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') {
              const lower = v.toLowerCase().trim();
              return lower !== '' && lower !== 'no' && lower !== 'false' && lower !== '0';
            }
            return Boolean(v);
          };
          return (
          <div className="flex items-center space-x-2">
            <Switch
              id={name}
              checked={toBool(field.value)}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={name}
                className={
                  disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }
              >
                {label}
              </Label>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        );}}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
};
