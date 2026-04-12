import { formatDistanceToNow } from "date-fns";
import { Webhook } from "lucide-react";
import { listAdminWebhooks } from "@/server/admin";
import { WebhookActions } from "@/components/admin";
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

export default async function AdminWebhooksPage() {
  const webhooks = await listAdminWebhooks();

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description={`${webhooks.length} webhooks across all organizations`}
      />

      {webhooks.length === 0 ? (
        <EmptyState icon={Webhook} title="No webhooks found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Webhook</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Events</TableHead>
                <TableHead className="hidden lg:table-cell">Last triggered</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{w.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {w.url}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{w.orgName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={w.isActive ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {(w.events ?? []).length} events
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {w.lastTriggeredAt
                      ? formatDistanceToNow(new Date(w.lastTriggeredAt), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <WebhookActions webhookId={w.id} isActive={w.isActive} />
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
