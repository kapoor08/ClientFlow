"use client";

import { motion } from "framer-motion";
import { PageHeader, SearchFiltersBar, ActionIcons, Pagination } from "../shared";

const CLIENTS = [
  { initials: "LK", name: "Lakshay Kapoor", company: "NIL", contact: "Lakshay Kapoor", email: "lakshaykapoor08@gmail.com", status: "Active", projects: 0, updated: "Apr 4, 2026" },
  { initials: "SA", name: "Santos", company: "Momentum", contact: "Santos", email: "santos@momentum.com", status: "Active", projects: 0, updated: "Mar 19, 2026" },
  { initials: "MA", name: "Matt", company: "Snapback Returns", contact: "Matt", email: "matt@gmail.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
  { initials: "AL", name: "Allen", company: "Acme Corporation", contact: "Allen", email: "allen@gmail.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
  { initials: "AA", name: "Aaron", company: "Fanzoo", contact: "Aaron", email: "aaron@fanzooapp.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
  { initials: "AK", name: "Ali Kavousi", company: "The List", contact: "Ali", email: "ali@thelist.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
  { initials: "PK", name: "Preet Kahlon", company: "QiKo", contact: "Preet", email: "preet@qiko.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
  { initials: "JK", name: "Joe Kiernan", company: "Metal Promo", contact: "Joe", email: "joe@metalpromo.com", status: "Active", projects: 0, updated: "Mar 18, 2026" },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function HeroClientsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader title="Clients" description="12 clients in Lakshay's Workspace" actionLabel="Add Client" />
      <SearchFiltersBar placeholder="Search clients..." showDates showFilters showViewToggle />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Actions", "Client", "Company", "Contact", "Status", "Projects", "Updated"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c, i) => (
              <motion.tr
                key={c.name}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-2.5"><ActionIcons /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[6px] font-semibold text-primary">{c.initials}</div>
                    <span className="text-[11px] font-medium text-foreground">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{c.company}</td>
                <td className="px-4 py-2.5">
                  <div className="text-[11px] font-medium text-foreground">{c.contact}</div>
                  <div className="text-[9px] text-muted-foreground">{c.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-medium text-success">{c.status}</span>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{c.projects}</td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{c.updated}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="Showing 1-10 of 12 results" />
      </div>
    </div>
  );
}
