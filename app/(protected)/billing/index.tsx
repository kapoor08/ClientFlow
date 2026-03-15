import { Button } from "@/components/ui/button";
import { mockInvoices } from "@/data/mockData";
import { CreditCard, Download } from "lucide-react";

const statusBadge: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  overdue: "bg-danger/10 text-danger",
  draft: "bg-neutral-300/50 text-neutral-700",
};

const BillingPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and invoices
        </p>
      </div>

      {/* Current Plan */}
      <div className="mb-8 rounded-card border border-primary/30 bg-brand-100/20 p-6 shadow-cf-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Professional Plan
              </h2>
              <span className="rounded-pill bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Active
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              $79/month · Renews on April 1, 2026
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Change Plan
            </Button>
            <Button variant="outline" size="sm">
              Payment Methods
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-xs text-muted-foreground">Team Members</p>
            <p className="font-display text-lg font-bold text-foreground">
              6{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / 25
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-xs text-muted-foreground">Projects</p>
            <p className="font-display text-lg font-bold text-foreground">
              6{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / ∞
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-xs text-muted-foreground">Storage Used</p>
            <p className="font-display text-lg font-bold text-foreground">
              2.4 GB{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / 50 GB
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Invoice History
      </h2>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Invoice
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Client
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Due Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {inv.number}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {inv.clientName}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {inv.amount}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {inv.dueDate}
                </td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                    <Download size={14} />
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

export default BillingPage;
