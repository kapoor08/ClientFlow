import { buildMetadata } from "@/lib/seo";
import { verifyUnsubscribeToken } from "@/server/email/unsubscribe-token";
import { isSuppressed } from "@/server/email/suppressions";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Unsubscribe",
  description: "Manage your ClientFlow email preferences.",
  noIndex: true,
});

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const email = rawToken ? verifyUnsubscribeToken(rawToken) : null;

  if (!email || !rawToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="text-foreground text-2xl font-semibold">Invalid or expired link</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          This unsubscribe link could not be verified. If you keep receiving unwanted email, please
          reply to any message from ClientFlow and we&apos;ll remove you manually.
        </p>
      </main>
    );
  }

  const alreadySuppressed = await isSuppressed(email);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <UnsubscribeForm token={rawToken} email={email} initiallySuppressed={alreadySuppressed} />
    </main>
  );
}
