import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { listSupportTickets } from "@/server/support";
import { TicketList } from "@/components/support";
import { Button } from "@/components/ui/button";

export default async function PortalSupportPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const tickets = await listSupportTickets(ctx.organizationId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/client-portal/support/new">
            <Plus size={14} />
            New ticket
          </Link>
        </Button>
      </div>

      <TicketList tickets={tickets} />
    </div>
  );
}
