import { notFound, redirect } from "next/navigation";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
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
    <FormPageLayout
      title={`Edit ${result.client.values.name}`}
      description="Update the client record and keep the primary contact details current."
      backHref={`/clients/${result.client.id}`}
      backLabel="Back to Client"
    >
      <ClientForm
        mode="edit"
        clientId={result.client.id}
        submitLabel="Save Changes"
        initialValues={result.client.values}
      />
    </FormPageLayout>
  );
}
