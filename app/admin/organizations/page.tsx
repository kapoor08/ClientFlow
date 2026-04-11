import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Building2, ExternalLink } from "lucide-react";
import { listAdminOrganizations } from "@/lib/admin-data";
import { AdminOrgActions } from "./AdminOrgActions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

export default async function AdminOrganizationsPage() {
  const orgs = await listAdminOrganizations();

  return (
    <div>
      <PageHeader
        title="Organizations"
        description={`${orgs.length} workspaces on the platform`}
      />

      {orgs.length === 0 ? (
        <EmptyState icon={Building2} title="No organizations yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden sm:table-cell">Members</TableHead>
                <TableHead className="hidden md:table-cell">Projects</TableHead>
                <TableHead className="hidden md:table-cell">Clients</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                        <Building2 size={13} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{org.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={org.planCode ?? "free"}
                      colorMap={PLAN_COLORS}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {org.memberCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {org.projectCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {org.clientCount}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {org.subscriptionStatus ? (
                      <StatusBadge status={org.subscriptionStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="View details"
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <AdminOrgActions
                        orgId={org.id}
                        orgName={org.name}
                        isActive={org.isActive}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
