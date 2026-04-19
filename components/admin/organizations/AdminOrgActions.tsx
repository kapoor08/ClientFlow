"use client";

import { useState, useTransition } from "react";
import { Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SuspendOrgDialog } from "./SuspendOrgDialog";
import { DeleteOrgDialog } from "./DeleteOrgDialog";
import { restoreOrgAction } from "@/server/actions/admin/organizations";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

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
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          {isSuspended ? (
            <TipButton
              label="Restore"
              onClick={handleRestore}
              disabled={isPending}
              variant="success"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
            </TipButton>
          ) : (
            <TipButton
              label="Suspend"
              onClick={() => setSuspendOpen(true)}
              disabled={isPending}
              variant="warning"
            >
              <PowerOff size={14} />
            </TipButton>
          )}
          <TipButton
            label="Delete"
            onClick={() => setDeleteOpen(true)}
            disabled={isPending}
            variant="danger"
          >
            <Trash2 size={14} />
          </TipButton>
        </div>
      </TooltipProvider>

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
