import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyUnsubscribeToken } from "@/server/email/unsubscribe-token";
import { unsubscribeStatusByEmail } from "@/server/status/subscribers";

/**
 * Unsubscribe landing page for status subscribers.
 *
 * Token is the HMAC-signed email from `createUnsubscribeToken` (same utility
 * the rest of the app's transactional unsubscribe links use). One click,
 * no expiry, no DB lookup required to verify - matches CAN-SPAM expectations.
 */
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? verifyUnsubscribeToken(token) : null;

  if (!email) {
    return (
      <Centered>
        <XCircle size={40} className="text-red-500" />
        <h1 className="text-foreground mt-4 text-2xl font-semibold">Invalid unsubscribe link</h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          The link is malformed or its signature didn&apos;t verify. If you keep getting emails you
          didn&apos;t sign up for, contact support.
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

  // Idempotent: deleting an already-deleted row is a no-op.
  await unsubscribeStatusByEmail(email);

  return (
    <Centered>
      <CheckCircle2 size={40} className="text-emerald-500" />
      <h1 className="text-foreground mt-4 text-2xl font-semibold">You&apos;re unsubscribed</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        We won&apos;t email <span className="text-foreground">{email}</span> about ClientFlow Status
        incidents anymore. Resubscribe any time from the status page.
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
