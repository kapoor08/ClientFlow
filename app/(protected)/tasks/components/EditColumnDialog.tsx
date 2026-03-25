"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateColumn, useUpdateColumn } from "@/core/task-columns/useCase";
import {
  COLUMN_TYPE_OPTIONS,
  PRESET_COLORS,
  type BoardColumn,
} from "@/core/task-columns/entity";
import { Plus } from "lucide-react";

type EditColumnDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  column?: BoardColumn;
};

export function EditColumnDialog({
  open,
  onClose,
  mode,
  column,
}: EditColumnDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [columnType, setColumnType] = useState<string>("none");
  const [description, setDescription] = useState("");
  const [hexInput, setHexInput] = useState("#3b82f6");

  const colorPickerRef = useRef<HTMLInputElement>(null);

  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();

  const isPending = createColumn.isPending || updateColumn.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && column) {
        setName(column.name);
        setColor(column.color);
        setHexInput(column.color);
        setColumnType(column.columnType ?? "none");
        setDescription(column.description ?? "");
      } else {
        setName("");
        setColor("#3b82f6");
        setHexInput("#3b82f6");
        setColumnType("none");
        setDescription("");
      }
    }
  }, [open, mode, column]);

  function handleColorSelect(c: string) {
    setColor(c);
    setHexInput(c);
  }

  function handleHexChange(val: string) {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setColor(val);
    }
  }

  function handleNativeColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setColor(e.target.value);
    setHexInput(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Column name is required.");
      return;
    }

    const resolvedColumnType = columnType === "none" ? null : columnType;

    if (mode === "create") {
      createColumn.mutate(
        {
          name: trimmedName,
          color,
          columnType: resolvedColumnType,
          description: description.trim() || null,
        },
        {
          onSuccess: () => {
            toast.success("Column created.");
            onClose();
          },
          onError: (err) => {
            toast.error(err.message ?? "Failed to create column.");
          },
        },
      );
    } else if (mode === "edit" && column) {
      updateColumn.mutate(
        {
          columnId: column.id,
          data: {
            name: trimmedName,
            color,
            columnType: resolvedColumnType,
            description: description.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast.success("Column updated.");
            onClose();
          },
          onError: (err) => {
            toast.error(err.message ?? "Failed to update column.");
          },
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Column" : "Edit Column"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          {/* Column Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Column Title <span className="text-danger">*</span>
            </label>
            <Input
              autoFocus
              placeholder="e.g. In Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              {/* Custom color picker trigger */}
              <button
                type="button"
                onClick={() => colorPickerRef.current?.click()}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                aria-label="Pick custom color"
              >
                <Plus size={14} />
              </button>
              <input
                ref={colorPickerRef}
                type="color"
                value={color}
                onChange={handleNativeColorChange}
                className="sr-only"
                aria-hidden
              />
            </div>
            {/* Hex input */}
            <div className="flex items-center gap-2 mt-1">
              <div
                className="h-6 w-6 rounded-full border border-border shrink-0"
                style={{ backgroundColor: color }}
              />
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Column Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Column Type
            </label>
            <Select value={columnType} onValueChange={setColumnType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this column…"
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : mode === "create"
                  ? "Create Column"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
