import { formatDistanceToNow } from "date-fns";
import { MailCheck, KeyRound, ShieldCheck } from "lucide-react";
import { UserDetailTabs } from "@/components/admin/users";
import type { getAdminUserDetail } from "@/server/admin/users";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>;

export default function AdminUserDetailPage({ detail }: { detail: Detail }) {
  const { user: u, orgs, sessions, auditLogs } = detail;

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="border-border bg-card shadow-cf-1 rounded-xl border p-6">
        <div className="mb-4 flex items-center gap-4">
          {u.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.image} alt={u.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="bg-brand-100 text-primary flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-foreground text-xl font-bold">{u.name}</h1>
              {u.isPlatformAdmin && (
                <span className="bg-danger/10 text-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                  <ShieldCheck size={10} /> Admin
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{u.email}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <MailCheck
              size={14}
              className={u.emailVerified ? "text-success" : "text-muted-foreground"}
            />
            <span className="text-muted-foreground">
              {u.emailVerified ? "Email verified" : "Email unverified"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <KeyRound
              size={14}
              className={u.twoFactorEnabled ? "text-success" : "text-muted-foreground"}
            />
            <span className="text-muted-foreground">
              {u.twoFactorEnabled ? "MFA enabled" : "MFA disabled"}
            </span>
          </div>
          <div className="text-muted-foreground text-sm">
            Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      <UserDetailTabs userId={u.id} orgs={orgs} sessions={sessions} auditLogs={auditLogs} />
    </div>
  );
}
