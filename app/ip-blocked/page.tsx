import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IpBlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
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
          Your IP address is not on the allowlist for this organization. Contact your administrator to request access.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/sign-in">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
