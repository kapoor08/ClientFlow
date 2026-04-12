"use client";

import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ColorPicker({ value, onChange, disabled, className }: ColorPickerProps) {
  function handleHexInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    onChange(raw);
    // Only propagate to the color picker when it's a valid full hex
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
    }
  }

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className="h-9 w-9 shrink-0 rounded-lg border border-border shadow-sm transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: isValidHex ? value : "#6366f1" }}
            aria-label="Pick a color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <HexColorPicker color={isValidHex ? value : "#6366f1"} className="cursor-pointer" onChange={onChange} />
          <Input
            value={value}
            onChange={handleHexInput}
            placeholder="#6366f1"
            maxLength={7}
            className="mt-2 font-mono text-sm"
          />
        </PopoverContent>
      </Popover>

      <Input
        value={value}
        onChange={handleHexInput}
        placeholder="#6366f1"
        className="w-36 font-mono text-sm"
        maxLength={7}
        disabled={disabled}
      />

      <div
        className="h-9 w-9 shrink-0 rounded-lg border border-border"
        style={{ backgroundColor: isValidHex ? value : "transparent" }}
      />
    </div>
  );
}
