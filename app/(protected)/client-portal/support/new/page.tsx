import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { NewTicketForm } from "@/components/support";

export default async function NewTicketPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  return (
    <div className="max-w-2xl">
      <Link
        href="/client-portal/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to tickets
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">New Support Ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your issue and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-cf-1">
        <NewTicketForm />
      </div>
    </div>
  );
}
