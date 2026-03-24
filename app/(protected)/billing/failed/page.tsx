import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Failed",
};

export default function BillingFailedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground">
          Payment failed
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your payment could not be processed. You have not been charged.
          Please try again or use a different payment method.
        </p>

        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-left space-y-2">
          <p className="text-sm font-medium text-foreground">Common reasons:</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            <li>Insufficient funds</li>
            <li>Card declined by your bank</li>
            <li>Incorrect card details entered</li>
            <li>Card expired or not supported</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/billing">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@clientflow.io"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
