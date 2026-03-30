"use client";

import { Eye, EyeOff } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ControlledInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  labelAddon?: React.ReactNode;
  control: Control<T>;
  placeholder?: string;
  error?: FieldError;
  type?: React.HTMLInputTypeAttribute;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  description?: string;
  className?: string;
  labelClassName?: string;
  showPasswordToggle?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}

export const ControlledInput = <T extends FieldValues>({
  name,
  label,
  labelAddon,
  control,
  placeholder,
  error,
  type = "text",
  min,
  max,
  step,
  disabled = false,
  description,
  className,
  labelClassName,
  showPasswordToggle = false,
  inputMode,
  autoComplete,
}: ControlledInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determine actual input type
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  // Apply padding for password toggle button and error styling
  const inputClassName = [
    showPasswordToggle && isPasswordField ? "pr-10" : "",
    error ? "border-destructive focus-visible:ring-destructive" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="grid gap-2">
      {label && (
        <div className={labelAddon ? "flex items-center justify-between" : undefined}>
          <Label
            htmlFor={name}
            className={error ? "text-destructive" : (labelClassName ?? "")}
          >
            {label}
          </Label>
          {labelAddon}
        </div>
      )}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              id={name}
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                if (type === "number") {
                  const val = e.target.valueAsNumber;
                  onChange(Number.isNaN(val) ? 0 : val);
                } else {
                  onChange(e.target.value);
                }
              }}
              placeholder={placeholder}
              type={inputType}
              aria-invalid={Boolean(error)}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              inputMode={inputMode}
              autoComplete={autoComplete}
              className={inputClassName}
            />
          )}
        />
        {showPasswordToggle && isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};
