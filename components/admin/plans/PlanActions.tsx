"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Copy, Power, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { togglePlanActiveAction } from "@/server/actions/admin/plans";
import { PlanFormDialog } from "./PlanFormDialog";
import { ClonePlanDialog } from "./ClonePlanDialog";
import type { getAdminPlansWithLimits } from "@/server/admin/plans";

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
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil size={13} /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCloneOpen(true)} className="gap-2">
            <Copy size={13} /> Clone
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleToggleActive}
            className={`gap-2 ${plan.isActive ? "text-warning focus:text-warning" : "text-success focus:text-success"}`}
          >
            <Power size={13} />
            {plan.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
