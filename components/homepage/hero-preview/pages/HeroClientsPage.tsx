"use client";

import { m as Motion } from "framer-motion";
import { PageHeader, SearchFiltersBar, ActionIcons, Pagination } from "../shared";

const CLIENTS = [
  {
    initials: "LK",
    name: "Lakshay Kapoor",
    company: "NIL",
    contact: "Lakshay Kapoor",
    email: "lakshaykapoor08@gmail.com",
    status: "Active",
    projects: 0,
    updated: "Apr 4, 2026",
  },
  {
    initials: "SA",
    name: "Santos",
    company: "Momentum",
    contact: "Santos",
    email: "santos@momentum.com",
    status: "Active",
    projects: 0,
    updated: "Mar 19, 2026",
  },
  {
    initials: "MA",
    name: "Matt",
    company: "Snapback Returns",
    contact: "Matt",
    email: "matt@gmail.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
  {
    initials: "AL",
    name: "Allen",
    company: "Acme Corporation",
    contact: "Allen",
    email: "allen@gmail.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
  {
    initials: "AA",
    name: "Aaron",
    company: "Fanzoo",
    contact: "Aaron",
    email: "aaron@fanzooapp.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
  {
    initials: "AK",
    name: "Ali Kavousi",
    company: "The List",
    contact: "Ali",
    email: "ali@thelist.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
  {
    initials: "PK",
    name: "Preet Kahlon",
    company: "QiKo",
    contact: "Preet",
    email: "preet@qiko.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
  {
    initials: "JK",
    name: "Joe Kiernan",
    company: "Metal Promo",
    contact: "Joe",
    email: "joe@metalpromo.com",
    status: "Active",
    projects: 0,
    updated: "Mar 18, 2026",
  },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function HeroClientsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader
        title="Clients"
        description="12 clients in Lakshay's Workspace"
        actionLabel="Add Client"
      />
      <SearchFiltersBar placeholder="Search clients..." showDates showFilters showViewToggle />

      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-secondary/50 border-b">
              {["Actions", "Client", "Company", "Contact", "Status", "Projects", "Updated"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-muted-foreground px-4 py-2.5 text-left text-[10px] font-semibold"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c, i) => (
              <Motion.tr
                key={c.name}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
              >
                <td className="px-4 py-2.5">
                  <ActionIcons />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[6px] font-semibold">
                      {c.initials}
                    </div>
                    <span className="text-foreground text-[11px] font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{c.company}</td>
                <td className="px-4 py-2.5">
                  <div className="text-foreground text-[11px] font-medium">{c.contact}</div>
                  <div className="text-muted-foreground text-[9px]">{c.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="bg-success/10 text-success inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium">
                    {c.status}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{c.projects}</td>
                <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{c.updated}</td>
              </Motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="Showing 1-10 of 12 results" />
      </div>
    </div>
  );
}
