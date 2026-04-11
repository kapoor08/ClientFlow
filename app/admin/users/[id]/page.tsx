import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getAdminUserDetail, revokeUserSession } from "@/lib/admin-data";
import { MailCheck, KeyRound, ShieldCheck } from "lucide-react";
import { RevokeSessionButton } from "./RevokeSessionButton";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user: u, orgs, sessions, apiKeys, auditLogs } = detail;

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-cf-1">
        <div className="flex items-center gap-4 mb-4">
          {u.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.image} alt={u.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-primary">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-foreground">{u.name}</h1>
              {u.isPlatformAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                  <ShieldCheck size={10} /> Admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{u.email}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <MailCheck size={14} className={u.emailVerified ? "text-success" : "text-muted-foreground"} />
            <span className="text-muted-foreground">{u.emailVerified ? "Email verified" : "Email unverified"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <KeyRound size={14} className={u.twoFactorEnabled ? "text-success" : "text-muted-foreground"} />
            <span className="text-muted-foreground">{u.twoFactorEnabled ? "MFA enabled" : "MFA disabled"}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Organizations */}
      <div className="rounded-xl border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Organizations ({orgs.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Organization</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">No organizations.</td></tr>
            ) : orgs.map((o) => (
              <tr key={o.orgId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{o.orgName}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{o.roleName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${o.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Active Sessions ({sessions.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">IP Address</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">User Agent</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Created</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Expires</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">No active sessions.</td></tr>
            ) : sessions.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.ipAddress ?? "-"}</td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate md:table-cell">{s.userAgent ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(s.expiresAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-right">
                  <RevokeSessionButton sessionId={s.id} userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {auditLogs.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">No activity found.</p>
          ) : auditLogs.map((log) => (
            <div key={log.id} className="flex items-start justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.entityType} · {log.ipAddress ?? "Unknown IP"}</p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
