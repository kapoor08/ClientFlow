"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices, invoiceKeys } from "@/core/invoices/useCase";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { InvoiceRow } from "./InvoiceRow";
import type { InvoiceListItem } from "@/core/invoices/entity";

type ClientOption = { id: string; name: string };

type Props = {
  clients: ClientOption[];
  canManage: boolean;
};

export function InvoicesPage({ clients, canManage }: Props) {
  const { data: invoices, isLoading } = useInvoices();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Invoices</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage and track client invoices
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Invoice
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : !invoices?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No invoices yet.</p>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Create your first invoice
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv: InvoiceListItem) => (
                <InvoiceRow key={inv.id} invoice={inv} onUpdated={refresh} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {canManage && (
        <CreateInvoiceDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={refresh}
          clients={clients}
        />
      )}
    </div>
  );
}
