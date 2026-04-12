"use client";

import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { SearchFiltersBar, ActionIcons, Pagination } from "../shared";
import { STATUS_STYLES, STATUS_LABELS, PRIORITY_STYLES } from "../data";

const PROJECTS = [
  { name: "Prop Firm Genie", client: "Kevin Tu", status: "in_progress", priority: "high", startDate: "Oct 10, 2025", dueDate: "-", updated: "Mar 23, 2026" },
  { name: "Invent Health", client: "Varun", status: "in_progress", priority: "high", startDate: "Aug 25, 2025", dueDate: "-", updated: "Mar 19, 2026" },
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
          <h2 className="text-base font-bold font-display text-foreground">Projects</h2>
          <p className="text-[11px] text-muted-foreground">2 projects total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-medium text-foreground">
            <LayoutTemplate size={10} />
            Templates
          </div>
          <div className="flex h-6 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground">
            + New Project
          </div>
        </div>
      </div>

      <SearchFiltersBar placeholder="Search projects..." showDates showFilters showViewToggle />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Actions", "Project", "Client", "Status", "Priority", "Start Date", "Due Date", "Updated"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p, i) => {
              const ps = PRIORITY_STYLES[p.priority];
              return (
                <motion.tr
                  key={p.name}
                  custom={i}
                  variants={row}
                  initial="hidden"
                  animate="show"
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-2.5"><ActionIcons /></td>
                  <td className="px-4 py-2.5 text-[11px] font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{p.client}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {ps && (
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${ps.dot}`} />
                        <span className={`text-[10px] font-medium capitalize ${ps.text}`}>{p.priority}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{p.startDate}</td>
                  <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{p.dueDate}</td>
                  <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{p.updated}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <Pagination showing="2 results" pageSize="10 / page" />
      </div>
    </div>
  );
}
