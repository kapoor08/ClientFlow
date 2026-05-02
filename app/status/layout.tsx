import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Status page layout.
 *
 * Deliberately minimal - no app shell, no auth-aware nav, no client providers
 * beyond what the root layout already supplies. The status surface is fully
 * public and may be hit when the rest of the app is degraded, so we keep the
 * dependency footprint small.
 */

export const metadata: Metadata = {
  title: "Status",
  description: "Real-time status of ClientFlow services and historical uptime.",
};

export default function StatusLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-foreground text-lg font-semibold">
            ClientFlow Status
          </Link>
          <Link
            href="https://www.client-flow.in"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Back to ClientFlow →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      <footer className="border-border mt-20 border-t">
        <div className="text-muted-foreground mx-auto max-w-4xl px-6 py-6 text-xs">
          {/* Honest-tradeoff note (see plan §H). Probes run from our own
              infrastructure, so a regional Vercel issue may not show here. */}
          Probes run from our application infrastructure. If you can&apos;t reach this page, the
          platform is likely fully unavailable - escalate via your account&apos;s support channel.
        </div>
      </footer>
    </div>
  );
}
