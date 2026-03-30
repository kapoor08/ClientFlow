import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { ClientForm } from "@/components/forms/ClientForm";
import { getClientForEditForUser } from "@/lib/clients";
import { getServerSession } from "@/lib/get-session";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await getServerSession();
  const { id } = await params;
  const result = await getClientForEditForUser(session!.user.id, id);

  if (!result.access) {
    redirect("/unauthorized");
  }

  if (!result.client) {
    notFound();
  }

  if (!result.access.canWrite) {
    redirect("/unauthorized");
  }

  return (
    <ListPageLayout
      title={`Edit ${result.client.values.name}`}
      description="Update the client record and keep the primary contact details current."
      action={
        <Link
          href={`/clients/${result.client.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Client
        </Link>
      }
    >
      <ClientForm
        mode="edit"
        clientId={result.client.id}
        submitLabel="Save Changes"
        initialValues={result.client.values}
      />
    </ListPageLayout>
  );
}
