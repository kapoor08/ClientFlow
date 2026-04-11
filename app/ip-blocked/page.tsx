import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/auth/SignOutButton";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { isIpAllowed, getClientIp } from "@/lib/ip-allowlist";

export default async function IpBlockedPage() {
  const session = await getServerSession();

  // Only redirect away when a full session exists AND the IP is not actually
  // blocked. When there is no session (e.g. 2FA is enabled and the user was
  // redirected here before completing TOTP), we must show the page - there is
  // no full session cookie yet, only a pending 2FA state.
  if (session?.user) {
    const [orgCtx, reqHeaders] = await Promise.all([
      getOrganizationSettingsContextForUser(session.user.id),
      headers(),
    ]);

    const clientIp = getClientIp(reqHeaders);
    const isBlocked =
      orgCtx?.ipAllowlist &&
      orgCtx.ipAllowlist.length > 0 &&
      !isIpAllowed(clientIp, orgCtx.ipAllowlist);

    if (!isBlocked) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <Link href="/" className="absolute left-6 top-6">
        <Image
          src="/app-logo.png"
          alt="ClientFlow"
          width={140}
          height={32}
          priority
        />
      </Link>
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/5" />
          <div className="absolute inset-3 rounded-full bg-destructive/10" />
          <ShieldAlert size={48} className="relative text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Access denied
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your IP address is not on the allowlist for this organization. Contact
          your administrator to request access.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {session?.user && <SignOutButton />}
          <Button asChild size="lg" variant="default">
            <Link href="/auth/sign-in">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
