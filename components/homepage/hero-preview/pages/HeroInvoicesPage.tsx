"use client";

import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { PageHeader, SearchFiltersBar, Pagination } from "../shared";
import { STATUS_STYLES, STATUS_LABELS } from "../data";

const INVOICES = [
  { number: "INV-00001", sub: "ClientFlow", client: "Lakshay Kapoor", amount: "$120.00", status: "paid", tag: "Manual", due: "Apr 2, 2026", created: "Apr 2, 2026" },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function HeroInvoicesPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader title="Invoices" description="Manage and track client invoices" actionLabel="New Invoice" />
      <SearchFiltersBar placeholder="Search invoices..." showDates showFilters />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Invoice", "Client", "Amount", "Status", "Due Date", "Created", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <motion.tr
                key={inv.number}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-foreground font-mono">{inv.number}</div>
                  <div className="text-[9px] text-muted-foreground">{inv.sub}</div>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{inv.client}</td>
                <td className="px-4 py-2.5 text-[11px] font-medium text-foreground">{inv.amount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLES[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                    {inv.tag && (
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {inv.tag}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{inv.due}</td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{inv.created}</td>
                <td className="px-4 py-2.5">
                  <MoreHorizontal size={10} className="text-muted-foreground/40" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="1 result" pageSize="20 / page" />
      </div>
    </div>
  );
}
