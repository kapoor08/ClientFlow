import "server-only";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerSession } from "@/server/auth/session";
import { AdminShell } from "@/components/layout/admin/AdminShell";

// Admin console is never indexable.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user || !session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
