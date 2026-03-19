"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormSection } from "../FormSection";

interface KeyValuePair {
  key: string;
  value: string;
}

interface DynamicKeyValueInputProps {
  title: string;
  description: string;
  items: KeyValuePair[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function DynamicKeyValueInput({
  title,
  description,
  items,
  onAdd,
  onRemove,
  onUpdate,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: DynamicKeyValueInputProps) {
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

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="grid gap-2 flex-1">
              <Label htmlFor={`key-${index}`}>Key</Label>
              <Input
                id={`key-${index}`}
                placeholder={keyPlaceholder}
                value={item.key ?? ""}
                onChange={(e) => onUpdate(index, "key", e.target.value)}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor={`value-${index}`}>Value</Label>
              <Input
                id={`value-${index}`}
                placeholder={valuePlaceholder}
                value={item.value ?? ""}
                onChange={(e) => onUpdate(index, "value", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="opacity-0">Delete</Label>
              {items.length === 1 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border border-red-600 disabled:cursor-not-allowed"
                        onClick={() => onRemove(index)}
                        disabled={true}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>At least one item is required</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border border-red-600 cursor-pointer"
                  onClick={() => onRemove(index)}
                  disabled={false}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}
