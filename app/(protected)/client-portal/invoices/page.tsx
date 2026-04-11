import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getPortalInvoicesForUser } from "@/lib/client-portal";
import { Receipt, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/common";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  open: "bg-info/10 text-info",
  draft: "bg-secondary text-muted-foreground",
  uncollectible: "bg-danger/10 text-danger",
  void: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  open: "Open",
  draft: "Draft",
  uncollectible: "Uncollectible",
  void: "Void",
};

export default async function ClientPortalInvoicesPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const invoices = await getPortalInvoicesForUser(session.user.id);
  if (!invoices) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Invoices
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on record
        </p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices will appear here once they are issued."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                  Due
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                  Paid
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground">
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-secondary text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {inv.status === "paid"
                      ? formatCurrency(inv.amountPaidCents, inv.currencyCode)
                      : formatCurrency(inv.amountDueCents, inv.currencyCode)}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {inv.dueAt
                      ? new Date(inv.dueAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {inv.paidAt
                      ? new Date(inv.paidAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.invoiceUrl ? (
                      <a
                        href={inv.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={13} />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
