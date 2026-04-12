"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Mail, MoreHorizontal, RefreshCw, TimerOff } from "lucide-react";
import { PageHeader, SearchFiltersBar, Pagination } from "../shared";

const ROLE_STYLES: Record<string, string> = {
  Client: "bg-violet-500/10 text-violet-600",
  Member: "bg-primary/10 text-primary",
  Admin: "bg-amber-500/10 text-amber-600",
};
const STATUS_ICON: Record<string, { icon: React.ElementType; style: string }> = {
  Accepted: { icon: CheckCircle2, style: "text-success" },
  Expired: { icon: TimerOff, style: "text-muted-foreground" },
  Pending: { icon: RefreshCw, style: "text-warning" },
};

const INVITATIONS = [
  { email: "aman@yopmail.com", by: "Lakshay Kapoor", role: "Client", status: "Accepted", sent: "15 days ago", expires: "-" },
  { email: "lakshaykapoor08@gmail.com", by: "Lakshay Kapoor", role: "Client", status: "Expired", sent: "22 days ago", expires: "Expired 15 days ago" },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.04, duration: 0.2 } }),
};

export function HeroInvitationsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader title="Invitations" description="Manage team invitations for Lakshay's Workspace" actionLabel="Send Invite" />
      <SearchFiltersBar placeholder="Search by email..." showDates showFilters />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Actions", "Email", "Role", "Status", "Sent", "Expires"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVITATIONS.map((inv, i) => {
              const si = STATUS_ICON[inv.status];
              const StatusIcon = si?.icon ?? MoreHorizontal;
              return (
                <motion.tr
                  key={inv.email}
                  custom={i}
                  variants={row}
                  initial="hidden"
                  animate="show"
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="h-3 w-3 rounded-sm bg-muted-foreground/15" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Mail size={10} className="text-muted-foreground/40" />
                      <div>
                        <div className="text-[11px] font-medium text-foreground">{inv.email}</div>
                        <div className="text-[9px] text-muted-foreground">by {inv.by}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${ROLE_STYLES[inv.role] ?? "bg-secondary text-muted-foreground"}`}>
                      {inv.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1">
                      <StatusIcon size={9} className={si?.style ?? ""} />
                      <span className="text-[10px] text-foreground">{inv.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{inv.sent}</td>
                  <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{inv.expires}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <Pagination showing="2 results" pageSize="20 / page" />
      </div>
    </div>
  );
}
