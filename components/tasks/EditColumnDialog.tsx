"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { ColorPicker } from "@/components/ui/color-picker";
import { useCreateColumn, useUpdateColumn } from "@/core/task-columns/useCase";
import {
  COLUMN_TYPE_OPTIONS,
  type BoardColumn,
} from "@/core/task-columns/entity";

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

  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();

  const isPending = createColumn.isPending || updateColumn.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && column) {
        setName(column.name);
        setColor(column.color);
        setColumnType(column.columnType ?? "none");
        setDescription(column.description ?? "");
      } else {
        setName("");
        setColor("#3b82f6");
        setColumnType("none");
        setDescription("");
      }
    }
  }, [open, mode, column]);

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

          {/* Color + Column Type */}
          <div className="flex items-end gap-4">
            <div className="space-y-1.5 min-w-0">
              <label className="text-sm font-medium text-foreground">
                Color
              </label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="shrink-0">
              <label className="text-sm font-medium text-foreground">
                Column Type
              </label>
              <Select value={columnType} onValueChange={setColumnType}>
                <SelectTrigger className="cursor-pointer w-36">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {COLUMN_TYPE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
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
