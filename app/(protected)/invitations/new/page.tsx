import { redirect } from "next/navigation";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { InviteForm } from "@/components/forms/InviteForm";
import { getInvitationsModuleAccessForUser } from "@/lib/invitations";
import { getServerSession } from "@/lib/get-session";

export default async function NewInvitationPage() {
  const session = await getServerSession();
  const access = await getInvitationsModuleAccessForUser(session!.user.id);

  if (!access || !access.canWrite) {
    redirect("/unauthorized");
  }

  return (
    <FormPageLayout
      title="Send Invitation"
      description="Invite someone to join your organization. They will receive an email with a link to accept."
      backHref="/invitations"
      backLabel="Back to Invitations"
    >
      <InviteForm />
    </FormPageLayout>
  );
}
