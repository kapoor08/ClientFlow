import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authRoutes } from "@/core/auth";
import { getServerSession } from "@/lib/get-session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (session?.user) {
    redirect(authRoutes.dashboard);
  }

  return children;
}
