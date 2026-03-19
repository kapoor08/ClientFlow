"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "../FormSection";

interface KeyValuePair {
  key: string;
  value: string;
}

interface AttributeKeyOption {
  value: string;
  label: string;
}

interface DynamicAttributesInputProps {
  title: string;
  description: string;
  items: KeyValuePair[];
  keyOptions: AttributeKeyOption[];
  errors?: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
  valuePlaceholder?: string;
}

export function DynamicAttributesInput({
  title,
  description,
  items,
  keyOptions,
  errors = [],
  onAdd,
  onRemove,
  onUpdate,
  valuePlaceholder = "e.g., 8%",
}: DynamicAttributesInputProps) {
  // Get existing keys to prevent duplicates
  const existingKeys = items.map((item) => item.key);

  return (
    <FormSection title={title} description={description}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Table Header */}
      {items.length > 0 && (
        <div className="grid grid-cols-12 gap-2 mb-4 mt-0">
          <div className="col-span-5">
            <Label className="font-semibold">Key</Label>
          </div>
          <div className="col-span-6">
            <Label className="font-semibold">Value</Label>
          </div>
          <div className="col-span-1"></div>
        </div>
      )}

      {/* Attribute Rows */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-12 gap-2 items-end">
              {/* Key Dropdown */}
              <div className="col-span-5">
                <Select
                  value={item.key}
                  onValueChange={(value) => onUpdate(index, "key", value)}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select key..." />
                  </SelectTrigger>
                  <SelectContent>
                    {keyOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={
                          existingKeys.includes(option.value) &&
                          option.value !== item.key
                        }
                        className="cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div className="col-span-6">
                <Input
                  id={`value-${index}`}
                  placeholder={valuePlaceholder}
                  value={item.value}
                  onChange={(e) => onUpdate(index, "value", e.target.value)}
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="border border-red-600 hover:bg-red-500/10 disabled:cursor-not-allowed cursor-pointer w-full"
                  onClick={() => onRemove(index)}
                  disabled={items.length === 1}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {errors[index] && (
              <p className="text-sm text-destructive mt-1">{errors[index]}</p>
            )}
          </div>
        ))}
      </div>
    </FormSection>
  );
}
