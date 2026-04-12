import "server-only";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/server/auth/session";
import { AdminShell } from "@/components/layout/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user || !session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
