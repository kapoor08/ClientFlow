"use client";

import { useState, useTransition } from "react";
import { Pencil, Copy, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { togglePlanActiveAction } from "@/server/actions/admin/plans";
import { PlanFormDialog } from "./PlanFormDialog";
import { ClonePlanDialog } from "./ClonePlanDialog";
import type { getAdminPlansWithLimits } from "@/server/admin/plans";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

type PlanRow = Awaited<ReturnType<typeof getAdminPlansWithLimits>>[number];

type Props = { plan: PlanRow };

export function PlanActions({ plan }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);

  function handleToggleActive() {
    startTransition(async () => {
      const result = await togglePlanActiveAction(plan.id, !plan.isActive);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(plan.isActive ? "Plan deactivated." : "Plan activated.");
        router.refresh();
      }
    });
  }

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <TipButton
            label="Edit"
            onClick={() => setEditOpen(true)}
            disabled={isPending}
          >
            <Pencil size={14} />
          </TipButton>
          <TipButton
            label="Clone"
            onClick={() => setCloneOpen(true)}
            disabled={isPending}
          >
            <Copy size={14} />
          </TipButton>
          <TipButton
            label={plan.isActive ? "Deactivate" : "Activate"}
            onClick={handleToggleActive}
            disabled={isPending}
            variant={plan.isActive ? "warning" : "success"}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
          </TipButton>
        </div>
      </TooltipProvider>

      <PlanFormDialog plan={plan} open={editOpen} onOpenChange={setEditOpen} />
      <ClonePlanDialog
        sourcePlanId={plan.id}
        sourcePlanName={plan.name}
        open={cloneOpen}
        onOpenChange={setCloneOpen}
      />
    </>
  );
}
