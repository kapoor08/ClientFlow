"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * After Stripe redirects to the success page:
 * 1. Waits ~2s for the webhook to write the new subscription to the DB.
 * 2. Calls router.refresh() so the layout re-renders with the new planCode
 *    (unlocking any previously locked sidebar modules).
 */
export function SubscriptionActivator() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.refresh();
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
