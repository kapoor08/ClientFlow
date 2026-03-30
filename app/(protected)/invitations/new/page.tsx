import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
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
    <ListPageLayout
      title="Send Invitation"
      description="Invite someone to join your organization. They will receive an email with a link to accept."
      action={
        <Link
          href="/invitations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Invitations
        </Link>
      }
    >
      <InviteForm />
    </ListPageLayout>
  );
}
