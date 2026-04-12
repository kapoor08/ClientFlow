import { formatDistanceToNow } from "date-fns";
import { FileKey2 } from "lucide-react";
import { listAdminApiKeys } from "@/server/admin";
import { ApiKeyActions } from "@/components/admin";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KEY_STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  revoked: "bg-secondary text-muted-foreground",
  expired: "bg-danger/10 text-danger",
};

export default async function AdminApiKeysPage() {
  const keys = await listAdminApiKeys();

  return (
    <div>
      <PageHeader
        title="API Keys"
        description={`${keys.length} API keys across all organizations`}
      />

      {keys.length === 0 ? (
        <EmptyState icon={FileKey2} title="No API keys found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden sm:table-cell">Created by</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last used</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => {
                const isExpired = !!k.expiresAt && new Date(k.expiresAt) < new Date();
                const statusLabel = k.revokedAt ? "revoked" : isExpired ? "expired" : "active";
                return (
                  <TableRow key={k.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{k.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{k.keyPrefix}…</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{k.orgName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {k.creatorName ?? "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={statusLabel} colorMap={KEY_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {k.lastUsedAt
                        ? formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ApiKeyActions keyId={k.id} isActive={statusLabel === "active"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
