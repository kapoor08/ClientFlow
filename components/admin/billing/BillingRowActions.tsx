"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, ArrowLeftRight, Ban, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cancelAtPeriodEndAction } from "@/server/actions/admin/billing";
import { ExtendTrialDialog } from "./ExtendTrialDialog";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { RefundInvoiceDialog } from "./RefundInvoiceDialog";
import type { AdminSubscriptionRow } from "@/server/admin/billing";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

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
  const [refundOpen, setRefundOpen] = useState(false);

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
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          {isTrialing && (
            <TipButton
              label="Extend trial"
              onClick={() => setExtendOpen(true)}
              disabled={isPending}
            >
              <CalendarPlus size={14} />
            </TipButton>
          )}
          <TipButton
            label="Change plan"
            onClick={() => setChangePlanOpen(true)}
            disabled={isPending}
          >
            <ArrowLeftRight size={14} />
          </TipButton>
          <TipButton
            label="Refund invoice"
            onClick={() => setRefundOpen(true)}
            disabled={isPending}
            variant="warning"
          >
            <RefreshCcw size={14} />
          </TipButton>
          <TipButton
            label="Cancel at period end"
            onClick={handleCancelAtPeriodEnd}
            disabled={isPending}
            variant="danger"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
          </TipButton>
        </div>
      </TooltipProvider>

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
      <RefundInvoiceDialog
        subscriptionId={subscription.id}
        orgName={subscription.orgName}
        open={refundOpen}
        onOpenChange={setRefundOpen}
      />
    </>
  );
}
