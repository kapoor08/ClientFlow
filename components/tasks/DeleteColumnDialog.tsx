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

type DeleteColumnDialogProps = {
  open: boolean;
  columnName: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function DeleteColumnDialog({
  open,
  columnName,
  onClose,
  onConfirm,
  isPending,
}: DeleteColumnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" />
            Delete Column
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">"{columnName}"</span>?
          Tasks in this column will be unassigned. This action cannot be undone.
        </p>
        <DialogFooter showCloseButton={false}>
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="cursor-pointer"
          >
            {isPending ? "Deleting…" : "Delete Column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
