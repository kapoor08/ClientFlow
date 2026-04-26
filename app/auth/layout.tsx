import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { authRoutes } from "@/core/auth";
import { getServerSession } from "@/server/auth/session";

// Auth pages (sign-in, sign-up, reset, etc.) are not indexable.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (session?.user) {
    redirect(authRoutes.dashboard);
  }

  return children;
}
