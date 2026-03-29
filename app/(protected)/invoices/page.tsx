import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { listClientsForUser } from "@/lib/clients";
import { InvoicesPage } from "./index";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function Page() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const [ctx, clientsResult] = await Promise.all([
    getOrganizationSettingsContextForUser(session.user.id),
    listClientsForUser(session.user.id, { pageSize: 200 }),
  ]);

  if (!ctx) redirect("/auth/sign-in");

  const clients = clientsResult.clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <InvoicesPage
      clients={clients}
      canManage={ctx.canManageSettings}
    />
  );
}
