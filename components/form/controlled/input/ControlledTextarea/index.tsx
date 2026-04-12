"use client";

import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ControlledTextareaProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  control: Control<T>;
  placeholder?: string;
  error?: FieldError;
  rows?: number;
  disabled?: boolean;
  description?: string;
  className?: string;
  maxChars?: number;
}

export const ControlledTextarea = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  error,
  rows,
  disabled = false,
  description,
  className,
  maxChars,
}: ControlledTextareaProps<T>) => {
  return (
    <div className="grid gap-2">
      {label && (
        <Label htmlFor={name} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const charCount = (field.value || "").length;
          const isOverLimit = maxChars ? charCount > maxChars : false;

          // Combine error styling with custom className
          const textareaClassName = [
            error ? "border-destructive focus-visible:ring-destructive" : "",
            className || "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          return (
            <>
              <Textarea
                id={name}
                {...field}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                rows={rows}
                disabled={disabled}
                className={textareaClassName}
                maxLength={maxChars}
              />
              {maxChars && (
                <p
                  className={`text-sm ${
                    isOverLimit ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {charCount} / {maxChars} characters
                </p>
              )}
            </>
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
