"use client";

import { useState } from "react";
import { MoreHorizontal, Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = { orgId: string; orgName: string; isActive: boolean };

export function AdminOrgActions({ orgId, orgName, isActive }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleToggle() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isActive ? "suspend" : "activate" }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? "Organization suspended." : "Organization activated.");
      router.refresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Organization deleted.");
      router.refresh();
    } catch {
      toast.error("Delete failed.");
    } finally {
      setPending(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            disabled={pending}
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <MoreHorizontal size={13} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleToggle} className="gap-2">
            {isActive ? <PowerOff size={13} className="text-warning" /> : <Power size={13} className="text-success" />}
            {isActive ? "Suspend" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-danger focus:text-danger">
            <Trash2 size={13} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{orgName}</strong> and all its members, projects, and clients will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger text-white hover:bg-danger/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
