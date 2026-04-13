import { OrgDetailTabs, ForceLogoutButton } from "@/components/admin/organizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { getAdminOrgDetail } from "@/server/admin/organizations";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminOrgDetail>>>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-warning/10 text-warning",
  deleted: "bg-danger/10 text-danger",
};

export default function AdminOrgDetailPage({ detail }: { detail: Detail }) {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{detail.org.name}</h1>
            <StatusBadge status={detail.org.status} colorMap={STATUS_COLORS} />
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{detail.org.slug}</p>
          {detail.org.suspendedReason && (
            <p className="mt-2 text-xs text-warning">
              Suspended reason: {detail.org.suspendedReason}
            </p>
          )}
        </div>
        <ForceLogoutButton orgId={detail.org.id} orgName={detail.org.name} />
      </div>
      <OrgDetailTabs detail={detail} />
    </div>
  );
}
