import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProjectForm } from "@/components/forms/projects";
import { getProjectModuleAccessForUser } from "@/server/projects";
import { listClientsForUser } from "@/server/clients";
import { getServerSession } from "@/server/auth/session";

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
    <div>
      <Breadcrumbs
        items={[{ label: "Projects", href: "/projects" }, { label: "New" }]}
        className="mb-4"
      />
      <ListPageLayout title="New Project" description="Create a project and link it to a client.">
        <ProjectForm mode="create" submitLabel="Create Project" clients={clientOptions} />
      </ListPageLayout>
    </div>
  );
}
