"use client";

import { motion } from "framer-motion";
import { Briefcase, Calendar, CheckSquare, CreditCard, Download, Eye, FolderOpen, MessageSquare, Upload, Users } from "lucide-react";
import { Pagination } from "../shared";

const USAGE_ROW1 = [
  { icon: Users, label: "Team Members", value: "2", limit: "\u221E" },
  { icon: FolderOpen, label: "Projects", value: "2", limit: "\u221E" },
  { icon: Briefcase, label: "Clients", value: "12", limit: "\u221E" },
];
const USAGE_ROW2 = [
  { icon: CheckSquare, label: "Tasks Created", value: "4", limit: "\u221E" },
  { icon: MessageSquare, label: "Comments", value: "1", limit: "\u221E" },
  { icon: Upload, label: "File Uploads", value: "0", limit: "\u221E" },
];

const BILLING_HISTORY = [
  { invoice: "TANPWQ7T-0002", amount: "$29", status: "Paid", issued: "April 7, 2026" },
  { invoice: "7JIRI3Q3-0003", amount: "$48", status: "Paid", issued: "March 26, 2026" },
  { invoice: "7JIRI3Q3-0002", amount: "$29", status: "Paid", issued: "March 25, 2026" },
  { invoice: "7JIRI3Q3-0001", amount: "$0", status: "Paid", issued: "March 24, 2026" },
  { invoice: "TANPWQ7T-0001", amount: "$0", status: "Paid", issued: "March 24, 2026" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25 } }),
};

export function HeroBillingPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="mb-2.5">
        <h2 className="text-base font-bold font-display text-foreground">Billing</h2>
        <p className="text-[11px] text-muted-foreground">Manage your subscription and invoices</p>
      </div>

      {/* Subscription card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 rounded-lg border border-border bg-card p-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard size={10} className="text-foreground" />
            <span className="text-sm font-bold text-foreground">Professional</span>
            <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-foreground">Change Plan</div>
            <div className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-foreground">Manage Billing</div>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">$79/month · Renews April 25, 2026</div>
        <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Calendar size={6} /> Renews in 13 days
        </div>
      </motion.div>

      {/* Usage */}
      <div className="mb-2">
        <h3 className="mb-1.5 text-[13px] font-bold text-foreground">Usage</h3>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {USAGE_ROW1.map(({ icon: Icon, label, value, limit }, i) => (
            <motion.div key={label} custom={i} variants={fadeIn} initial="hidden" animate="show" className="rounded-lg border border-border bg-card p-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon size={7} /> {label}</div>
              <div className="mt-1 text-sm font-bold text-foreground">{value} <span className="text-[11px] font-normal text-muted-foreground">/ {limit}</span></div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* This Month's Activity */}
      <div className="mb-3">
        <h3 className="mb-1.5 text-[13px] font-bold text-foreground">This Month&apos;s Activity</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {USAGE_ROW2.map(({ icon: Icon, label, value, limit }, i) => (
            <motion.div key={label} custom={i + 3} variants={fadeIn} initial="hidden" animate="show" className="rounded-lg border border-border bg-card p-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon size={7} /> {label}</div>
              <div className="mt-1 text-sm font-bold text-foreground">{value} <span className="text-[11px] font-normal text-muted-foreground">/ {limit}</span></div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <h3 className="mb-1.5 text-[13px] font-bold text-foreground">Subscription Billing History</h3>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Invoice", "Amount", "Status", "Issued", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_HISTORY.map((b, i) => (
              <motion.tr key={b.invoice} custom={i} variants={fadeIn} initial="hidden" animate="show" className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-2.5 text-[11px] font-mono text-foreground">{b.invoice}</td>
                <td className="px-4 py-2.5 text-[11px] font-medium text-foreground">{b.amount}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">{b.status}</span>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{b.issued}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <Eye size={7} className="text-muted-foreground/30" />
                    <Download size={7} className="text-muted-foreground/30" />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="5 invoices" pageSize="10 / page" />
      </div>
    </div>
  );
}
