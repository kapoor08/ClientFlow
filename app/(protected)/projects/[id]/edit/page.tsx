import { notFound, redirect } from "next/navigation";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { getProjectForEditForUser, getProjectModuleAccessForUser } from "@/lib/projects";
import { listClientsForUser } from "@/lib/clients";
import { getServerSession } from "@/lib/get-session";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const session = await getServerSession();
  const userId = session!.user.id;
  const { id } = await params;

  const [result, clientsResult] = await Promise.all([
    getProjectForEditForUser(userId, id),
    listClientsForUser(userId, { pageSize: 500 }),
  ]);

  if (!result.access) {
    redirect("/unauthorized");
  }
  if (!result.project) {
    notFound();
  }
  if (!result.access.canWrite) {
    redirect("/unauthorized");
  }

  const clientOptions = clientsResult.clients.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  return (
    <FormPageLayout
      title={`Edit ${result.project.values.name}`}
      description="Update the project details and timeline."
      backHref={`/projects/${result.project.id}`}
      backLabel="Back to Project"
    >
      <ProjectForm
        mode="edit"
        projectId={result.project.id}
        submitLabel="Save Changes"
        initialValues={result.project.values}
        clients={clientOptions}
      />
    </FormPageLayout>
  );
}
