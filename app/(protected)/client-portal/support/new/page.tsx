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
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        Back to tickets
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">New Support Ticket</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe your issue and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <div className="border-border bg-card shadow-cf-1 rounded-xl border p-6">
        <NewTicketForm />
      </div>
    </div>
  );
}
