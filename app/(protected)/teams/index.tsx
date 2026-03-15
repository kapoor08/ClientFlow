import { mockTeamMembers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Shield } from "lucide-react";

const roleBadge: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
  client: "bg-warning/10 text-warning",
};

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  invited: "bg-warning/10 text-warning",
};

const TeamPage = () => {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Team & Roles</h1>
          <p className="text-sm text-muted-foreground">{mockTeamMembers.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Shield size={14} className="mr-1.5" /> Manage Roles
          </Button>
          <Button size="sm">
            <Plus size={14} className="mr-1.5" /> Invite Member
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Projects</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Last Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {mockTeamMembers.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
                      {m.initials}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[m.role]}`}>
                    {m.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[m.status]}`}>
                    {m.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{m.projectCount}</td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">{m.lastActive}</td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPage;
