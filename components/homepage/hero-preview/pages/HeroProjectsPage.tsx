"use client";

import { m as Motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { SearchFiltersBar, ActionIcons, Pagination } from "../shared";
import { STATUS_STYLES, STATUS_LABELS, PRIORITY_STYLES } from "../data";

const PROJECTS = [
  {
    name: "Prop Firm Genie",
    client: "Kevin Tu",
    status: "in_progress",
    priority: "high",
    startDate: "Oct 10, 2025",
    dueDate: "-",
    updated: "Mar 23, 2026",
  },
  {
    name: "Invent Health",
    client: "Varun",
    status: "in_progress",
    priority: "high",
    startDate: "Aug 25, 2025",
    dueDate: "-",
    updated: "Mar 19, 2026",
  },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function HeroProjectsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-display text-foreground text-base font-bold">Projects</h2>
          <p className="text-muted-foreground text-[11px]">2 projects total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="border-border bg-background text-foreground flex h-6 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium">
            <LayoutTemplate size={10} />
            Templates
          </div>
          <div className="bg-primary text-primary-foreground flex h-6 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium">
            + New Project
          </div>
        </div>
      </div>

      <SearchFiltersBar placeholder="Search projects..." showDates showFilters showViewToggle />

      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-secondary/50 border-b">
              {[
                "Actions",
                "Project",
                "Client",
                "Status",
                "Priority",
                "Start Date",
                "Due Date",
                "Updated",
              ].map((h) => (
                <th
                  key={h}
                  className="text-muted-foreground px-4 py-2.5 text-left text-[10px] font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p, i) => {
              const ps = PRIORITY_STYLES[p.priority];
              return (
                <Motion.tr
                  key={p.name}
                  custom={i}
                  variants={row}
                  initial="hidden"
                  animate="show"
                  className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <ActionIcons />
                  </td>
                  <td className="text-foreground px-4 py-2.5 text-[11px] font-medium">{p.name}</td>
                  <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{p.client}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLES[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {ps && (
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${ps.dot}`} />
                        <span className={`text-[10px] font-medium capitalize ${ps.text}`}>
                          {p.priority}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{p.startDate}</td>
                  <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{p.dueDate}</td>
                  <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{p.updated}</td>
                </Motion.tr>
              );
            })}
          </tbody>
        </table>
        <Pagination showing="2 results" pageSize="10 / page" />
      </div>
    </div>
  );
}
