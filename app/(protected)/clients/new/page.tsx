import { redirect } from "next/navigation";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { ClientForm } from "@/components/forms/ClientForm";
import { getClientModuleAccessForUser } from "@/lib/clients";
import { getServerSession } from "@/lib/get-session";

export default async function NewClientPage() {
  const session = await getServerSession();
  const access = await getClientModuleAccessForUser(session!.user.id);

  if (!access || !access.canWrite) {
    redirect("/unauthorized");
  }

  return (
    <FormPageLayout
      title="Add Client"
      description="Create a client record for your organization and store the primary contact details."
      backHref="/clients"
      backLabel="Back to Clients"
    >
      <ClientForm mode="create" submitLabel="Create Client" />
    </FormPageLayout>
  );
}
