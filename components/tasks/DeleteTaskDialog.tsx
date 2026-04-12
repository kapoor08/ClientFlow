"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

type DeleteTaskDialogProps = {
  open: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function DeleteTaskDialog({
  open,
  taskTitle,
  onClose,
  onConfirm,
  isPending,
}: DeleteTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" />
            Delete Task
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">"{taskTitle}"</span>?
          This action cannot be undone.
        </p>
        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
