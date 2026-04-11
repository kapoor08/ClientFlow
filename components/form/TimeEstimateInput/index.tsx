"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Conversion constants ─────────────────────────────────────────────────────
// 1w = 5d, 1d = 8h, 1h = 60m
export const MINS_PER_HOUR = 60;
export const MINS_PER_DAY = 8 * MINS_PER_HOUR;   // 480
export const MINS_PER_WEEK = 5 * MINS_PER_DAY;   // 2400

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert stored minutes → human string, e.g. 570 → "1d 1h 30m" */
export function minutesToEstimate(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "";
  let rem = Math.round(minutes);
  const weeks = Math.floor(rem / MINS_PER_WEEK);
  rem %= MINS_PER_WEEK;
  const days = Math.floor(rem / MINS_PER_DAY);
  rem %= MINS_PER_DAY;
  const hours = Math.floor(rem / MINS_PER_HOUR);
  const mins = rem % MINS_PER_HOUR;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(" ");
}

/**
 * Parse a human estimate string → minutes.
 * Accepted tokens: \d+[wWhHdDmM] in any order, separated by optional spaces.
 * Returns null for empty input, undefined for invalid format.
 */
export function parseEstimate(input: string): number | null | undefined {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Must be entirely composed of valid tokens (no stray characters)
  if (!/^(\d+\s*[wWdDhHmM]\s*)+$/.test(trimmed)) return undefined;

  let total = 0;
  const TOKEN = /(\d+)\s*([wWdDhHmM])/g;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(trimmed)) !== null) {
    const val = parseInt(match[1], 10);
    switch (match[2].toLowerCase()) {
      case "w": total += val * MINS_PER_WEEK; break;
      case "d": total += val * MINS_PER_DAY; break;
      case "h": total += val * MINS_PER_HOUR; break;
      case "m": total += val; break;
    }
  }
  return total > 0 ? total : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TimeEstimateInputProps {
  /** Stored value in minutes */
  value: number | null | undefined;
  onChange: (minutes: number | null) => void;
  /** Placeholder shown inside the text input while editing */
  placeholder?: string;
  /** Text shown in the display button when value is empty */
  displayPlaceholder?: string;
  /** Tooltip shown on hover of the display button */
  tooltip?: string;
  className?: string;
  /** "sm" is compact (table cells), "md" is standard form field */
  size?: "sm" | "md";
  disabled?: boolean;
  /** Start in editing mode immediately (e.g. inside a dialog) */
  defaultEditing?: boolean;
}

export function TimeEstimateInput({
  value,
  onChange,
  placeholder = "e.g. 1w 2d 3h",
  displayPlaceholder,
  tooltip,
  className,
  size = "md",
  disabled = false,
  defaultEditing = false,
}: TimeEstimateInputProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (disabled) return;
    setDraft(minutesToEstimate(value));
    setInvalid(false);
    setIsEditing(true);
  }

  function commit() {
    const parsed = parseEstimate(draft);
    if (parsed === undefined) {
      // invalid format - keep editing, highlight error
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    onChange(parsed);
    setIsEditing(false);
    setInvalid(false);
  }

  function cancel() {
    setIsEditing(false);
    setInvalid(false);
    setDraft("");
  }

  const displayValue = minutesToEstimate(value);

  if (isEditing) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <Input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
          placeholder={placeholder}
          className={cn(
            "bg-white",
            size === "sm" ? "h-7 w-28 px-2 text-xs" : "h-9 w-full",
            invalid && "border-danger focus-visible:ring-danger/30",
          )}
        />
        {invalid && (
          <p className="text-[10px] text-danger">
            Use: 1w 2d 3h 30m (w=week, d=day, h=hour, m=min)
          </p>
        )}
      </div>
    );
  }

  const button = (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      className={cn(
        "rounded text-left transition-colors",
        size === "sm" ? "text-xs" : "text-sm",
        disabled
          ? "cursor-default text-muted-foreground"
          : "cursor-pointer hover:text-primary",
        displayValue ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {displayValue || (
        <span className={displayPlaceholder ? "text-muted-foreground/50" : ""}>
          {displayPlaceholder ?? (size === "sm" ? "-" : placeholder)}
        </span>
      )}
    </button>
  );

  if (!tooltip || disabled) return button;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
