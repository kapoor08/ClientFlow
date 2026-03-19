import { redirect } from "next/navigation";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { getProjectModuleAccessForUser } from "@/lib/projects";
import { listClientsForUser } from "@/lib/clients";
import { getServerSession } from "@/lib/get-session";

export default async function NewProjectPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const [access, clientsResult] = await Promise.all([
    getProjectModuleAccessForUser(userId),
    listClientsForUser(userId, { pageSize: 500 }),
  ]);

  if (!access || !access.canWrite) {
    redirect("/unauthorized");
  }

  const clientOptions = clientsResult.clients.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  return (
    <FormPageLayout
      title="New Project"
      description="Create a project and link it to a client."
      backHref="/projects"
      backLabel="Back to Projects"
    >
      <ProjectForm
        mode="create"
        submitLabel="Create Project"
        clients={clientOptions}
      />
    </FormPageLayout>
  );
}
