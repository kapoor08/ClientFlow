import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/db/auth-schema";
import { getAdminTicketDetail } from "@/server/admin/support";
import AdminTicketPage from "./index";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, admins] = await Promise.all([
    getAdminTicketDetail(id),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.isPlatformAdmin, true)),
  ]);

  if (!detail) notFound();

  return <AdminTicketPage detail={detail} adminOptions={admins} />;
}
