import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { ClientForm } from "@/components/forms/ClientForm";
import { getClientForEditForUser, getClientModuleAccessForUser } from "@/lib/clients";
import { getClientNotes } from "@/lib/client-notes";
import { getServerSession } from "@/lib/get-session";
import { ClientNotesSection } from "@/components/clients/ClientNotesSection";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

async function ClientNotesSectionLoader({
  clientId,
  organizationId,
  canWrite,
}: {
  clientId: string;
  organizationId: string;
  canWrite: boolean;
}) {
  const notes = await getClientNotes(clientId, organizationId);
  return (
    <div className="mt-8">
      <ClientNotesSection
        clientId={clientId}
        initialNotes={notes}
        canWrite={canWrite}
      />
    </div>
  );
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await getServerSession();
  const { id } = await params;
  const [result, access] = await Promise.all([
    getClientForEditForUser(session!.user.id, id),
    getClientModuleAccessForUser(session!.user.id),
  ]);

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
      title={`Edit ${result.client.values.name}'s details`}
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

      <ClientNotesSectionLoader
        clientId={result.client.id}
        organizationId={access!.organizationId}
        canWrite={access!.canWrite}
      />
    </ListPageLayout>
  );
}
