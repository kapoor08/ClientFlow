"use client";

import { useState } from "react";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

type Props = { userId: string; userName: string };

export function AdminUserActions({ userId, userName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleRevokeAll() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/sessions`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("All sessions revoked.");
      router.refresh();
    } catch {
      toast.error("Failed to revoke sessions.");
    } finally {
      setPending(false);
      setRevokeOpen(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("User deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setPending(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <TipButton
            label="Revoke all sessions"
            onClick={() => setRevokeOpen(true)}
            disabled={pending}
            variant="warning"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          </TipButton>
          <TipButton
            label="Delete account"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
            variant="danger"
          >
            <Trash2 size={14} />
          </TipButton>
        </div>
      </TooltipProvider>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userName}</strong> will be signed out of all devices immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleRevokeAll}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={deleteOpen ? undefined : setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userName}</strong> and all their memberships will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger text-white hover:bg-danger/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
