"use client";

import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { DEFAULT_BRAND_COLOR } from "@/constants/colors";

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
            className="border-border focus-visible:ring-ring h-9 w-9 shrink-0 cursor-pointer rounded-lg border shadow-sm transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: isValidHex ? value : DEFAULT_BRAND_COLOR }}
            aria-label="Pick a color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <HexColorPicker
            color={isValidHex ? value : DEFAULT_BRAND_COLOR}
            className="cursor-pointer"
            onChange={onChange}
          />
          <Input
            value={value}
            onChange={handleHexInput}
            placeholder={DEFAULT_BRAND_COLOR}
            maxLength={7}
            className="mt-2 font-mono text-sm"
          />
        </PopoverContent>
      </Popover>

      <Input
        value={value}
        onChange={handleHexInput}
        placeholder={DEFAULT_BRAND_COLOR}
        className="w-36 font-mono text-sm"
        maxLength={7}
        disabled={disabled}
      />

      <div
        className="border-border h-9 w-9 shrink-0 rounded-lg border"
        style={{ backgroundColor: isValidHex ? value : "transparent" }}
      />
    </div>
  );
}
