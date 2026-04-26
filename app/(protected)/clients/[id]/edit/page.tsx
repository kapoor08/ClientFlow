import { notFound, redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ClientForm } from "@/components/forms/clients";
import { getClientForEditForUser, getClientModuleAccessForUser } from "@/server/clients";
import { getClientNotes } from "@/server/client-notes";
import { getServerSession } from "@/server/auth/session";
import { ClientNotesSection } from "@/components/clients";

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
      <ClientNotesSection clientId={clientId} initialNotes={notes} canWrite={canWrite} />
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
    <div>
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          {
            label: result.client.values.name,
            href: `/clients/${result.client.id}`,
          },
          { label: "Edit" },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title={`Edit ${result.client.values.name}'s details`}
        description="Update the client record and keep the primary contact details current."
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
    </div>
  );
}
