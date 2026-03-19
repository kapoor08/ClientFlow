"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
  description,
  disabled = false,
}: SwitchFieldProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor={id}
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
  );
}
