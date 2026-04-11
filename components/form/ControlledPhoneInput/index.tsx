"use client";

import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type {
  Control,
  ControllerRenderProps,
  FieldError,
  FieldValues,
  Path,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import { AsYouType, parsePhoneNumber } from "libphonenumber-js/min";
import { ChevronsUpDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

// Probe multiple digit patterns to find the longest valid formatted template.
// Some countries (UK, DE, …) only produce formatted output with a 0-prefix.
// Results are cached so this only runs once per country.
const maxLengthCache = new Map<Country, number>();

function getMaxLength(country: Country): number {
  if (maxLengthCache.has(country)) return maxLengthCache.get(country)!;

  let best = 0;
  const makeDigits = [
    (n: number) => "9".repeat(n),
    (n: number) => "0" + "7".repeat(Math.max(0, n - 1)),
    (n: number) => "0" + "8".repeat(Math.max(0, n - 1)),
  ];

  for (const mk of makeDigits) {
    for (let n = 5; n <= 15; n++) {
      const f = new AsYouType(country);
      f.input(mk(n));
      const tpl = f.getTemplate();
      // Ignore pure-digit templates ("xxxx…") - those mean the formatter gave up.
      if (tpl && /[^x]/.test(tpl)) best = Math.max(best, tpl.length);
    }
  }

  const result = best || 25;
  maxLengthCache.set(country, result);
  return result;
}

// ─── Country selector ─────────────────────────────────────────────────────────

type CountryOption = { value: Country | undefined; label: string };

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 8;

function CountryList({
  filtered,
  selected,
  onSelect,
}: {
  filtered: CountryOption[];
  selected: Country | undefined;
  onSelect: (code: Country) => void;
}) {
  return (
    <div
      className="overflow-y-auto"
      style={{ maxHeight: VISIBLE_ITEMS * ITEM_HEIGHT }}
    >
      {filtered.map((opt) => {
        const code = opt.value!;
        const calling = getCountryCallingCode(code);
        const isSelected = selected === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            style={{ height: ITEM_HEIGHT }}
            className={cn(
              "flex w-full items-center gap-2 px-3 text-sm cursor-pointer",
              "transition-colors hover:bg-accent",
              isSelected && "bg-accent font-medium",
            )}
          >
            <span className="text-base">{getFlagEmoji(code)}</span>
            <span className="flex-1 text-left">{opt.label}</span>
            <span className="text-xs text-muted-foreground">+{calling}</span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: Country | undefined;
  onChange: (v: Country | undefined) => void;
  options: CountryOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.value &&
        (q === "" ||
          o.label.toLowerCase().includes(q) ||
          `+${getCountryCallingCode(o.value)}`.includes(q) ||
          o.value.toLowerCase().includes(q)),
    );
  }, [options, search]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Select country"
          disabled={disabled}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1 rounded-l-lg rounded-r-none",
            "border border-r-0 border-input bg-transparent px-2.5",
            "text-sm text-foreground transition-colors outline-none",
            "hover:bg-muted/50 focus-visible:z-10 focus-visible:border-ring",
            "focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="text-base leading-none">
            {value ? getFlagEmoji(value) : "🌐"}
          </span>
          <span className="text-xs font-medium tabular-nums">
            {value ? `+${getCountryCallingCode(value)}` : "-"}
          </span>
          <ChevronsUpDown size={11} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 overflow-hidden"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No country found.
          </p>
        ) : (
          <CountryList
            filtered={filtered}
            selected={value}
            onSelect={(code) => {
              onChange(code);
              handleOpenChange(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Inner phone field ────────────────────────────────────────────────────────
//
// Defined at module level (not inside ControlledPhoneInput) so React sees a
// stable component type and never unmounts/remounts it between renders.
//
// Why a separate component?
//   The library's `value` prop must always be E.164 or "".  Passing our
//   "_invalid_" sentinel directly causes a console warning AND may clear the
//   user's partial input.  By keeping a local `displayValue` state we can:
//     • show the library "" (unchanged from before) when the user types partial
//       digits - the library's own input state keeps the partial visible
//     • store "_invalid_" in field.value so Zod can reject it
//   These two pieces of state never need to be the same string.

type PhoneFieldProps = {
  field: ControllerRenderProps<FieldValues, string>;
  name: string;
  error?: FieldError;
  disabled: boolean;
  placeholder: string;
  defaultCountry: Country;
};

function PhoneField({
  field,
  name,
  error,
  disabled,
  placeholder,
  defaultCountry,
}: PhoneFieldProps) {
  const hasRawInputRef = useRef(false);

  // displayValue is what we pass to the library - always E.164 or "".
  // We intentionally do NOT update it when the user is typing a partial number.
  // The library already maintains its own internal input state; by not changing
  // displayValue we avoid the library resetting the user's partially-typed text.
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const v = field.value;
    if (!v || v === "_invalid_") return "";
    // Normalize to strict E.164: stored values might have formatting spaces
    // (e.g. "+91 9745254890") which the library rejects. parsePhoneNumber
    // strips them and returns the canonical form ("+919745254890").
    try {
      return parsePhoneNumber(v)?.number ?? "";
    } catch {
      return "";
    }
  });

  // maxLength for the HTML input - computed per country via AsYouType template.
  const maxLengthRef = useRef(getMaxLength(defaultCountry));

  const trackRawInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      hasRawInputRef.current = e.target.value.replace(/\D/g, "").length > 0;
    },
    [],
  );

  const handleCountryChange = useCallback((country: Country | undefined) => {
    if (country) maxLengthRef.current = getMaxLength(country);
  }, []);

  // useMemo keeps the component reference stable (redefining forwardRef inside
  // render creates a new type → React unmounts the input on every render).
  const PhoneInputField = useMemo(
    () =>
      forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
        ({ className, onChange, ...props }, ref) => (
          <Input
            ref={ref}
            className={cn(
              "rounded-l-none border-l-0 focus-visible:z-10",
              className,
            )}
            {...props}
            // Set maxLength after spread so our value always wins.
            maxLength={maxLengthRef.current}
            onChange={(e) => {
              trackRawInput(e);
              onChange?.(e);
            }}
          />
        ),
      ),
    [trackRawInput],
  );

  return (
    <PhoneInput
      id={name}
      value={displayValue}
      onChange={(val) => {
        if (val) {
          // Valid E.164 - keep library and field in sync.
          setDisplayValue(val);
          field.onChange(val);
        } else if (hasRawInputRef.current) {
          // Library returned undefined: user typed digits but the number is
          // incomplete or invalid.  Do NOT update displayValue - the library's
          // own input state still shows the partial text, so leaving displayValue
          // unchanged prevents a controlled-value reset on re-render.
          // Store "_invalid_" so Zod's refine() rejects the field.
          field.onChange("_invalid_");
        } else {
          // Truly empty - user cleared the field.
          setDisplayValue("");
          field.onChange("");
        }
        // Trigger onBlur so validation fires immediately
        // (requires mode: "onBlur" or "onTouched" in the parent useForm).
        setTimeout(field.onBlur, 0);
      }}
      onBlur={field.onBlur}
      onCountryChange={handleCountryChange}
      disabled={disabled}
      placeholder={placeholder}
      defaultCountry={defaultCountry}
      inputComponent={PhoneInputField}
      countrySelectComponent={PhoneCountrySelect}
      className={cn(
        "flex w-full",
        error &&
          "[&_input]:border-destructive [&_input]:focus-visible:ring-destructive",
      )}
    />
  );
}

// ─── ControlledPhoneInput ─────────────────────────────────────────────────────

export type ControlledPhoneInputProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  control: Control<T>;
  error?: FieldError;
  disabled?: boolean;
  placeholder?: string;
  defaultCountry?: Country;
};

export function ControlledPhoneInput<T extends FieldValues>({
  name,
  label,
  control,
  error,
  disabled = false,
  placeholder = "Phone number",
  defaultCountry = "US",
}: ControlledPhoneInputProps<T>) {
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
        render={({ field }) => (
          <PhoneField
            field={field as ControllerRenderProps<FieldValues, string>}
            name={name}
            error={error}
            disabled={disabled}
            placeholder={placeholder}
            defaultCountry={defaultCountry}
          />
        )}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
