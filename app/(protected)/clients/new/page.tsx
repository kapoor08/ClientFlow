import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { ClientForm } from "@/components/forms/clients";
import { getClientModuleAccessForUser } from "@/server/clients";
import { getServerSession } from "@/server/auth/session";

export default async function NewClientPage() {
  const session = await getServerSession();
  const access = await getClientModuleAccessForUser(session!.user.id);

  if (!access || !access.canWrite) {
    redirect("/unauthorized");
  }

  return (
    <ListPageLayout
      title="Add Client"
      description="Create a client record for your organization and store the primary contact details."
      action={
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Clients
        </Link>
      }
    >
      <ClientForm mode="create" submitLabel="Create Client" />
    </ListPageLayout>
  );
}
