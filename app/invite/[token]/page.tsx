import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvitationByToken } from "@/lib/invitations";
import { getServerSession } from "@/lib/get-session";
import { acceptInviteAction } from "@/lib/invite-actions";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function InviteAcceptPage({ params, searchParams }: Props) {
  const [{ token }, { error: errorParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const invitation = await getInvitationByToken(token);

  // Invalid token
  if (!invitation) {
    return (
      <InviteLayout>
        <StatusCard
          icon={<XCircle size={40} className="text-danger" />}
          title="Invalid invitation"
          description="This invitation link is invalid or has already been used."
          action={<Button asChild><Link href="/auth/sign-in">Go to sign in</Link></Button>}
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
              : <Button asChild variant="outline"><Link href="/auth/sign-in">Go to sign in</Link></Button>
          }
        />
      </InviteLayout>
    );
  }

  // Valid invite — require login
  const session = await getServerSession();
  if (!session) {
    redirect(`/auth/sign-in?redirectTo=/invite/${token}`);
  }

  // Bind the token into the server action
  const accept = acceptInviteAction.bind(null, token);

  return (
    <InviteLayout>
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-cf-2 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCheck size={32} className="text-primary" />
          </div>
        </div>

        <h1 className="font-display text-xl font-semibold text-foreground mb-1">
          You've been invited
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Join <strong className="text-foreground">{invitation.organizationName}</strong> as{" "}
          <strong className="text-foreground">{invitation.roleName}</strong>
        </p>

        {errorParam && (
          <div className="mb-4 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {errorParam}
          </div>
        )}

        <p className="mb-6 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
        </p>

        <div className="flex flex-col gap-3">
          <form action={accept}>
            <Button type="submit" className="w-full">
              Accept & Join {invitation.organizationName}
            </Button>
          </form>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Not now</Link>
          </Button>
        </div>
      </div>
    </InviteLayout>
  );
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
