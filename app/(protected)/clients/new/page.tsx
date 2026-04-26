import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
    <div>
      <Breadcrumbs
        items={[{ label: "Clients", href: "/clients" }, { label: "New" }]}
        className="mb-4"
      />
      <ListPageLayout
        title="Add Client"
        description="Create a client record for your organization and store the primary contact details."
      >
        <ClientForm mode="create" submitLabel="Create Client" />
      </ListPageLayout>
    </div>
  );
}
