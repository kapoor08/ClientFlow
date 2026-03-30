import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
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
    <ListPageLayout
      title="New Project"
      description="Create a project and link it to a client."
      action={
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      }
    >
      <ProjectForm
        mode="create"
        submitLabel="Create Project"
        clients={clientOptions}
      />
    </ListPageLayout>
  );
}
