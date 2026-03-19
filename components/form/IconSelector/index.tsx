"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { AVAILABLE_ICONS } from "@/components/admin/CMSContentForm/iconOptions";

interface IconSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function IconSelector({
  value,
  onChange,
  label,
  placeholder = "Select icon...",
  className,
  error,
}: IconSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedIcon = AVAILABLE_ICONS.find((icon) => icon.value === value);
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label className="text-xs">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-8 text-sm",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              {SelectedIconComponent && (
                <SelectedIconComponent className="h-4 w-4" />
              )}
              <span>{selectedIcon?.label || placeholder}</span>
            </div>
            <svg
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search icons..." className="h-9" />
            <CommandList>
              <CommandEmpty>No icon found.</CommandEmpty>
              <CommandGroup>
                {AVAILABLE_ICONS.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  return (
                    <CommandItem
                      key={iconOption.value}
                      value={iconOption.value}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <IconComponent className="h-4 w-4" />
                        <span>{iconOption.label}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === iconOption.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
