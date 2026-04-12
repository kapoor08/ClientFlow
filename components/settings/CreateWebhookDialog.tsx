"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { WEBHOOK_EVENTS } from "@/schemas/webhooks";

type CreateWebhookDialogProps = {
  open: boolean;
  name: string;
  url: string;
  selectedEvents: string[];
  isPending: boolean;
  onNameChange: (val: string) => void;
  onUrlChange: (val: string) => void;
  onToggleEvent: (event: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function CreateWebhookDialog({
  open,
  name,
  url,
  selectedEvents,
  isPending,
  onNameChange,
  onUrlChange,
  onToggleEvent,
  onSubmit,
  onClose,
}: CreateWebhookDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
          <DialogDescription>
            Configure an endpoint to receive event notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wh-name">Name</Label>
            <Input
              id="wh-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="My Webhook"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-url">Endpoint URL</Label>
            <Input
              id="wh-url"
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs hover:bg-secondary/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => onToggleEvent(event)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              !name.trim() ||
              !url.trim() ||
              selectedEvents.length === 0 ||
              isPending
            }
            className="cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Creating…
              </>
            ) : (
              "Create Webhook"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
