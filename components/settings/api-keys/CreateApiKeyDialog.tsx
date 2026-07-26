"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CreateApiKeyDialogProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (v: string) => void;
  expiry: string;
  onExpiryChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
};

export function CreateApiKeyDialog({
  open,
  onClose,
  name,
  onNameChange,
  expiry,
  onExpiryChange,
  onSubmit,
  isPending,
}: CreateApiKeyDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Give this key a descriptive name so you know where it&apos;s used.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="key-name">Key name</Label>
            <Input
              id="key-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. My Integration"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-expiry">Expiry</Label>
            <Select value={expiry} onValueChange={onExpiryChange}>
              <SelectTrigger className="w-full cursor-pointer" id="key-expiry">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">No expiry</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            {expiry === "never" && (
              <div className="border-warning/30 bg-warning/5 flex items-start gap-2 rounded-md border px-3 py-2">
                <AlertTriangle size={13} className="text-warning mt-0.5 shrink-0" />
                <p className="text-warning text-xs">
                  Keys with no expiry remain active indefinitely. Rotate them regularly or set an
                  expiry date for better security.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!name.trim() || isPending}
            className="cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Creating…
              </>
            ) : (
              "Create Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
