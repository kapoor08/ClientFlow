"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { forceLogoutOrgMembersAction } from "@/server/actions/admin/organizations";

type Props = { orgId: string; orgName: string };

export function ForceLogoutButton({ orgId, orgName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await forceLogoutOrgMembersAction(orgId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`All members of ${orgName} have been logged out.`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-warning border-warning/30 hover:bg-warning/10"
      >
        <LogOut size={13} />
        Force logout all
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force logout all members?</AlertDialogTitle>
            <AlertDialogDescription>
              All active sessions for every member of{" "}
              <strong>{orgName}</strong> will be immediately invalidated. They will need
              to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {isPending ? "Logging out…" : "Force logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
