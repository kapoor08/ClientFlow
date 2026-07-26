"use client";

import { m as Motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  CheckSquare,
  CreditCard,
  Download,
  Eye,
  FolderOpen,
  MessageSquare,
  Upload,
  Users,
} from "lucide-react";
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
        <h2 className="font-display text-foreground text-base font-bold">Billing</h2>
        <p className="text-muted-foreground text-[11px]">Manage your subscription and invoices</p>
      </div>

      {/* Subscription card */}
      <Motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-border bg-card mb-3 rounded-lg border p-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard size={10} className="text-foreground" />
            <span className="text-foreground text-sm font-bold">Professional</span>
            <span className="bg-success/10 text-success rounded-full px-1.5 py-0.5 text-[9px] font-medium">
              Active
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="border-border text-foreground rounded-md border px-1.5 py-0.5 text-[10px]">
              Change Plan
            </div>
            <div className="border-border text-foreground rounded-md border px-1.5 py-0.5 text-[10px]">
              Manage Billing
            </div>
          </div>
        </div>
        <div className="text-muted-foreground mt-1 text-[11px]">
          $79/month · Renews April 25, 2026
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-0.5 text-[10px]">
          <Calendar size={6} /> Renews in 13 days
        </div>
      </Motion.div>

      {/* Usage */}
      <div className="mb-2">
        <h3 className="text-foreground mb-1.5 text-[13px] font-bold">Usage</h3>
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          {USAGE_ROW1.map(({ icon: Icon, label, value, limit }, i) => (
            <Motion.div
              key={label}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="show"
              className="border-border bg-card rounded-lg border p-2"
            >
              <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                <Icon size={7} /> {label}
              </div>
              <div className="text-foreground mt-1 text-sm font-bold">
                {value}{" "}
                <span className="text-muted-foreground text-[11px] font-normal">/ {limit}</span>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>

      {/* This Month's Activity */}
      <div className="mb-3">
        <h3 className="text-foreground mb-1.5 text-[13px] font-bold">This Month&apos;s Activity</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {USAGE_ROW2.map(({ icon: Icon, label, value, limit }, i) => (
            <Motion.div
              key={label}
              custom={i + 3}
              variants={fadeIn}
              initial="hidden"
              animate="show"
              className="border-border bg-card rounded-lg border p-2"
            >
              <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                <Icon size={7} /> {label}
              </div>
              <div className="text-foreground mt-1 text-sm font-bold">
                {value}{" "}
                <span className="text-muted-foreground text-[11px] font-normal">/ {limit}</span>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <h3 className="text-foreground mb-1.5 text-[13px] font-bold">Subscription Billing History</h3>
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-secondary/50 border-b">
              {["Invoice", "Amount", "Status", "Issued", ""].map((h, i) => (
                <th
                  key={i}
                  className="text-muted-foreground px-4 py-2.5 text-left text-[10px] font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_HISTORY.map((b, i) => (
              <Motion.tr
                key={b.invoice}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                animate="show"
                className="border-border hover:bg-secondary/30 border-b last:border-0"
              >
                <td className="text-foreground px-4 py-2.5 font-mono text-[11px]">{b.invoice}</td>
                <td className="text-foreground px-4 py-2.5 text-[11px] font-medium">{b.amount}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-success/10 text-success inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                    {b.status}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{b.issued}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <Eye size={7} className="text-muted-foreground/30" />
                    <Download size={7} className="text-muted-foreground/30" />
                  </div>
                </td>
              </Motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="5 invoices" pageSize="10 / page" />
      </div>
    </div>
  );
}
