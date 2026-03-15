import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { authRoutes } from "@/core/auth";
import { getServerSession } from "@/lib/get-session";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect(authRoutes.signIn);
  }

  const requireEmailVerification =
    process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

  if (requireEmailVerification && !session.user.emailVerified) {
    redirect(
      `${authRoutes.verifyEmail}?email=${encodeURIComponent(session.user.email)}`,
    );
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
