import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvitationByToken, acceptInvitationForUser } from "@/lib/invitations";
import { getServerSession } from "@/lib/get-session";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params;

  const invitation = await getInvitationByToken(token);

  // Invalid token
  if (!invitation) {
    return (
      <InviteLayout>
        <StatusCard
          icon={<XCircle size={40} className="text-danger" />}
          title="Invalid invitation"
          description="This invitation link is invalid or has already been used."
          action={<Button asChild><Link href="/login">Go to login</Link></Button>}
        />
      </InviteLayout>
    );
  }

  // Expired / revoked / accepted already
  if (invitation.status !== "pending") {
    const messages: Record<string, { title: string; description: string }> = {
      expired: {
        title: "Invitation expired",
        description: "This invitation link has expired. Ask your team admin to send a new one.",
      },
      revoked: {
        title: "Invitation revoked",
        description: "This invitation has been revoked. Contact your team admin for assistance.",
      },
      accepted: {
        title: "Already accepted",
        description: "This invitation has already been accepted.",
      },
    };
    const msg = messages[invitation.status] ?? {
      title: "Invitation unavailable",
      description: "This invitation is no longer valid.",
    };
    return (
      <InviteLayout>
        <StatusCard
          icon={
            invitation.status === "accepted"
              ? <CheckCircle2 size={40} className="text-success" />
              : <XCircle size={40} className="text-danger" />
          }
          title={msg.title}
          description={msg.description}
          action={
            invitation.status === "accepted"
              ? <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
              : <Button asChild variant="outline"><Link href="/login">Go to login</Link></Button>
          }
        />
      </InviteLayout>
    );
  }

  // Valid invite — check if user is logged in
  const session = await getServerSession();

  if (!session) {
    // Not logged in — send to login with callback
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  // Try to accept
  try {
    const result = await acceptInvitationForUser(session.user.id, token);
    redirect(`/dashboard?welcome=1&org=${result.organizationId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not accept invitation.";
    return (
      <InviteLayout>
        <StatusCard
          icon={<XCircle size={40} className="text-danger" />}
          title="Could not accept invitation"
          description={message}
          action={<Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>}
        />
      </InviteLayout>
    );
  }
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mb-8 flex items-center gap-2">
        <Building2 size={24} className="text-primary" />
        <span className="font-display text-xl font-semibold text-foreground">
          ClientFlow
        </span>
      </div>
      {children}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-cf-2 text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h1 className="font-display text-xl font-semibold text-foreground mb-2">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
