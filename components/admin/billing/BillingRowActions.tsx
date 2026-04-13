"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  CalendarPlus,
  ArrowLeftRight,
  Ban,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cancelAtPeriodEndAction } from "@/server/actions/admin/billing";
import { ExtendTrialDialog } from "./ExtendTrialDialog";
import { ChangePlanDialog } from "./ChangePlanDialog";
import type { AdminSubscriptionRow } from "@/server/admin/billing";

type PlanOption = { value: string; label: string };

type Props = {
  subscription: AdminSubscriptionRow;
  planOptions: PlanOption[];
};

export function BillingRowActions({ subscription, planOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [extendOpen, setExtendOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);

  function handleCancelAtPeriodEnd() {
    startTransition(async () => {
      const result = await cancelAtPeriodEndAction(subscription.id, true);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Subscription set to cancel at period end.`);
        router.refresh();
      }
    });
  }

  const isTrialing = subscription.status === "trialing";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <MoreHorizontal size={13} />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {isTrialing && (
            <DropdownMenuItem onClick={() => setExtendOpen(true)} className="gap-2">
              <CalendarPlus size={13} /> Extend trial
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setChangePlanOpen(true)} className="gap-2">
            <ArrowLeftRight size={13} /> Change plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCancelAtPeriodEnd}
            className="gap-2 text-danger focus:text-danger"
          >
            <Ban size={13} /> Cancel at period end
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExtendTrialDialog
        subscriptionId={subscription.id}
        orgName={subscription.orgName}
        open={extendOpen}
        onOpenChange={setExtendOpen}
      />
      <ChangePlanDialog
        subscriptionId={subscription.id}
        orgName={subscription.orgName}
        currentPlanId={subscription.organizationId}
        planOptions={planOptions}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
      />
    </>
  );
}
