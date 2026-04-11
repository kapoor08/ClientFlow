import { formatDistanceToNow } from "date-fns";
import { ClipboardList } from "lucide-react";
import { listAdminAuditLogs } from "@/lib/admin-data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminAuditLogsPage() {
  const logs = await listAdminAuditLogs(200);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Platform-wide activity trail (last 200 entries)"
      />

      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No audit logs found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead className="hidden sm:table-cell">Actor</TableHead>
                <TableHead className="hidden md:table-cell">Organization</TableHead>
                <TableHead className="hidden lg:table-cell">IP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <p className="font-medium text-foreground font-mono text-xs">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {log.actorName ? (
                      <>
                        <p className="text-sm text-foreground">{log.actorName}</p>
                        <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {log.orgName ?? "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {log.ipAddress ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
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
