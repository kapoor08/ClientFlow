"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SuspendOrgDialog } from "./SuspendOrgDialog";
import { DeleteOrgDialog } from "./DeleteOrgDialog";
import { restoreOrgAction } from "@/server/actions/admin/organizations";

type Props = { orgId: string; orgName: string; isActive: boolean; status?: string };

export function AdminOrgActions({ orgId, orgName, isActive, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSuspended = status === "suspended" || !isActive;

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreOrgAction(orgId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${orgName} has been restored.`);
        router.refresh();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            disabled={isPending}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <MoreHorizontal size={13} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {isSuspended ? (
            <DropdownMenuItem onClick={handleRestore} className="gap-2">
              <Power size={13} className="text-success" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setSuspendOpen(true)} className="gap-2">
              <PowerOff size={13} className="text-warning" />
              Suspend
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="gap-2 text-danger focus:text-danger"
          >
            <Trash2 size={13} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SuspendOrgDialog
        orgId={orgId}
        orgName={orgName}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
      />
      <DeleteOrgDialog
        orgId={orgId}
        orgName={orgName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
