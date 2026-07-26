"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "./CopyButton";

type RevealedKeyDialogProps = {
  revealedKey: { key: string; name: string } | null;
  onClose: () => void;
};

export function RevealedKeyDialog({ revealedKey, onClose }: RevealedKeyDialogProps) {
  return (
    <Dialog
      open={!!revealedKey}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription>Copy this key now - it won&apos;t be shown again.</DialogDescription>
        </DialogHeader>
        <div className="rounded-card border-warning/30 bg-warning/5 border p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
            <p className="text-warning text-xs">
              Store this key somewhere safe. Once you close this dialog, it cannot be recovered.
            </p>
          </div>
        </div>
        <div className="border-border bg-secondary/50 flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs">
          <span className="flex-1 break-all">{revealedKey?.key}</span>
          {revealedKey && <CopyButton text={revealedKey.key} />}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="cursor-pointer">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
