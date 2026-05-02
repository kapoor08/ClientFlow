import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifySubscriberByToken } from "@/server/status/subscribers";

/**
 * Subscriber verification landing page.
 *
 * Reached via the link in the verification email
 * (`status.<host>/verify?token=<random>`). Server-renders the result so
 * there's no flash-of-loading state - the user sees confirmation
 * immediately.
 *
 * Token is one-shot: `verifySubscriberByToken` clears it on success, so
 * refreshing this page after a successful verify shows the failure state
 * (which is fine - they already received their welcome).
 */
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifySubscriberByToken(token) : null;

  if (result) {
    return (
      <Centered>
        <CheckCircle2 size={40} className="text-emerald-500" />
        <h1 className="text-foreground mt-4 text-2xl font-semibold">You&apos;re subscribed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We&apos;ll email <span className="text-foreground">{result.email}</span> when an incident
          affects ClientFlow services.
        </p>
        <Link
          href="/"
          className="text-foreground mt-6 inline-flex items-center text-sm underline-offset-4 hover:underline"
        >
          Back to status
        </Link>
      </Centered>
    );
  }

  return (
    <Centered>
      <XCircle size={40} className="text-red-500" />
      <h1 className="text-foreground mt-4 text-2xl font-semibold">Link invalid or expired</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Verification links expire after 24 hours and can only be used once. If you recently
        subscribed, request a new email by submitting the form again.
      </p>
      <Link
        href="/"
        className="text-foreground mt-6 inline-flex items-center text-sm underline-offset-4 hover:underline"
      >
        Back to status
      </Link>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      {children}
    </section>
  );
}
