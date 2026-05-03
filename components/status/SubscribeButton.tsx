"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubscribeForm } from "./SubscribeForm";

/**
 * Header-mounted "Subscribe to updates" entry point. Wraps the existing
 * inline `SubscribeForm` in a dialog so the call-to-action is reachable
 * from every page in the status surface (index, history, incident detail)
 * without redundant inline forms on each one.
 *
 * The form itself is unchanged - we just give it a different mount point.
 */
export function SubscribeButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="cursor-pointer">
          <Bell size={13} /> Subscribe to updates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to incident updates</DialogTitle>
          <DialogDescription>
            Get an email when an incident is opened, updated, or resolved.
          </DialogDescription>
        </DialogHeader>
        {/* SubscribeForm renders its own card chrome; inside the dialog we
            don't need the outer card so it sits flush. The form's success
            states (verify / already-subscribed) replace the form in place. */}
        <div className="-mx-1">
          <SubscribeForm compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
