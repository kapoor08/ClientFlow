"use client";

import { useTransition } from "react";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { DateRangeFilter, FiltersPopover, RowActions } from "@/components/data-table";
import type { BillingInvoiceItem } from "@/core/billing/entity";
import { formatDate, formatPrice, getStatusStyle } from "@/core/billing/entity";
import { BILLING_INVOICE_STATUS_OPTIONS as STATUS_OPTIONS } from "@/constants/billing";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaginationMeta } from "@/utils/pagination";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function BillingInvoicesPagination({ pagination }: { pagination: PaginationMeta }) {
  const [, startTransition] = useTransition();
  const [, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  const pages = buildPageNumbers(pagination.page, pagination.pageCount);
  const rangeStart = (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  function goToPage(page: number) {
    setParams({ page: page <= 1 ? null : page });
  }

  const pageSizeSelect = (
    <Select
      value={String(pagination.pageSize)}
      onValueChange={(value) =>
        setParams({
          pageSize: Number(value) === 10 ? null : Number(value),
          page: null,
        })
      }
    >
      <SelectTrigger size="sm" className="h-7 bg-white text-xs cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="top" className="w-fit!">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <SelectItem
            key={size}
            value={String(size)}
            className="text-xs cursor-pointer"
          >
            {size} / page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {pagination.total === 0
          ? "No invoices"
          : pagination.pageCount <= 1
            ? `${pagination.total} ${pagination.total === 1 ? "invoice" : "invoices"}`
            : `Showing ${rangeStart}-${rangeEnd} of ${pagination.total} invoices`}
      </p>

      {pagination.pageCount > 1 ? (
        <Pagination className="mx-0 w-fit">
          <PaginationContent>
            <PaginationItem>{pageSizeSelect}</PaginationItem>

            <PaginationItem>
              <Button
                variant="ghost"
                size="default"
                className="pl-1.5!"
                disabled={!pagination.hasPreviousPage}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </Button>
            </PaginationItem>

            {pages.map((page, index) =>
              page === "..." ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <Button
                    variant={page === pagination.page ? "outline" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => goToPage(page as number)}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Button
                variant="ghost"
                size="default"
                className="pr-1.5!"
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : (
        <div className="w-28">{pageSizeSelect}</div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: BillingInvoiceItem }) {
  const amount =
    invoice.status === "paid"
      ? formatPrice(invoice.amountPaidCents, invoice.currencyCode ?? "USD")
      : formatPrice(invoice.amountDueCents, invoice.currencyCode ?? "USD");

  const reference =
    invoice.number ??
    invoice.externalInvoiceId ??
    invoice.id.slice(0, 8).toUpperCase();

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
        {reference}
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{amount}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${getStatusStyle(invoice.status)}`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {formatDate(invoice.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <RowActions
          viewHref={invoice.invoiceUrl ?? undefined}
          downloadHref={invoice.invoicePdfUrl ?? undefined}
          downloadFileName={`${invoice.number ?? invoice.externalInvoiceId ?? invoice.id}.pdf`}
        />
      </td>
    </tr>
  );
}

export function InvoicesList({
  invoices,
  pagination,
}: {
  invoices: BillingInvoiceItem[];
  pagination: PaginationMeta;
}) {
  const [, startTransition] = useTransition();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Subscription Billing History
        </h2>
        <div className="flex items-center gap-2">
          <FiltersPopover
            filters={[
              {
                key: "status",
                label: "Status",
                options: STATUS_OPTIONS,
                value: status,
                onChange: (val) => setStatus(val || null),
              },
            ]}
          />
          <DateRangeFilter key={status} />
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Issued
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!invoices.length ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No subscription invoices found for the selected period.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <BillingInvoicesPagination pagination={pagination} />
    </>
  );
}
