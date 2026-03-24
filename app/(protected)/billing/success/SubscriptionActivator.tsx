"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { billingKeys } from "@/core/billing/useCase";

/**
 * After Stripe redirects to the success page:
 * 1. Waits ~2s for the webhook to write the new subscription to the DB.
 * 2. Invalidates the billing React Query cache so metrics/invoices refresh.
 * 3. Calls router.refresh() so the layout re-renders with the new planCode
 *    (unlocking any previously locked sidebar modules).
 */
export function SubscriptionActivator() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      router.refresh();
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, queryClient]);

  return null;
}
