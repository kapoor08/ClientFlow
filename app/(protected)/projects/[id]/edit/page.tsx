import { notFound, redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProjectForm } from "@/components/forms/projects";
import { getProjectForEditForUser } from "@/server/projects";
import { listClientsForUser } from "@/server/clients";
import { getServerSession } from "@/server/auth/session";

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
    <div>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          {
            label: result.project.values.name,
            href: `/projects/${result.project.id}`,
          },
          { label: "Edit" },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title={`Edit ${result.project.values.name}`}
        description="Update the project details and timeline."
      >
        <ProjectForm
          mode="edit"
          projectId={result.project.id}
          submitLabel="Save Changes"
          initialValues={result.project.values}
          clients={clientOptions}
        />
      </ListPageLayout>
    </div>
  );
}
