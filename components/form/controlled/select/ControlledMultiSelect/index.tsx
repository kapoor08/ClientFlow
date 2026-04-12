"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";

export type ControlledMultiSelectOption = {
  label: string;
  value: string;
};

export type ControlledMultiSelectProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: ControlledMultiSelectOption[];
  error?: FieldError;
  disabled?: boolean;
  description?: string;
  loading?: boolean;
};

export function ControlledMultiSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  options,
  error,
  disabled = false,
  description,
  loading = false,
}: ControlledMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const selectedValues: string[] = field.value || [];

          const handleSelect = (value: string) => {
            const newValues = selectedValues.includes(value)
              ? selectedValues.filter((v) => v !== value)
              : [...selectedValues, value];
            field.onChange(newValues);
          };

          const handleRemove = (value: string) => {
            const newValues = selectedValues.filter((v) => v !== value);
            field.onChange(newValues);
          };

          const selectedOptions = options.filter((opt) =>
            selectedValues.includes(opt.value),
          );

          return (
            <div className="space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    aria-expanded={open}
                    aria-invalid={Boolean(error)}
                    className="w-full justify-between font-normal cursor-pointer"
                    disabled={disabled || loading}
                  >
                    {selectedValues.length > 0 ? (
                      <span className="text-muted-foreground">
                        {selectedValues.length} selected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {loading ? "Loading..." : placeholder}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                      <CommandEmpty>No options found.</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => handleSelect(option.value)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedValues.includes(option.value)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Tags */}
              {selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={() => handleRemove(option.value)}
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {option.label}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
