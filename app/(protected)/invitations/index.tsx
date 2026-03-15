import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Clock, Mail, RefreshCw } from "lucide-react";

const mockInvitations = [
  {
    id: "i1",
    email: "nina@clientflow.io",
    role: "member",
    status: "pending",
    sentAt: "2 hours ago",
    expiresAt: "In 6 days",
  },
  {
    id: "i2",
    email: "carlos@agency.com",
    role: "manager",
    status: "pending",
    sentAt: "1 day ago",
    expiresAt: "In 5 days",
  },
  {
    id: "i3",
    email: "priya@design.co",
    role: "member",
    status: "accepted",
    sentAt: "3 days ago",
    expiresAt: "—",
  },
  {
    id: "i4",
    email: "old@partner.com",
    role: "client",
    status: "expired",
    sentAt: "2 weeks ago",
    expiresAt: "Expired",
  },
  {
    id: "i5",
    email: "blocked@spam.com",
    role: "member",
    status: "revoked",
    sentAt: "1 week ago",
    expiresAt: "—",
  },
];

const statusBadge: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  expired: "bg-neutral-300/50 text-neutral-500",
  revoked: "bg-danger/10 text-danger",
};

const roleBadge: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
  client: "bg-warning/10 text-warning",
};

const InvitationsPage = () => {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage team invitations
          </p>
        </div>
        <Button>
          <Plus size={16} className="mr-1.5" /> Send Invite
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Sent
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Expires
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {mockInvitations.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {inv.email}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[inv.role]}`}
                  >
                    {inv.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {inv.sentAt}
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {inv.expiresAt}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {inv.status === "pending" && (
                      <button
                        className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                        title="Resend"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvitationsPage;
