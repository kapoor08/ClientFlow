"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronDown, Download, Eye, Filter, Search } from "lucide-react";
import { Pagination } from "../shared";

const ENTITY_STYLES: Record<string, string> = {
  "Time Entry": "bg-success/10 text-success",
  Task: "bg-primary/10 text-primary",
  Client: "bg-info/10 text-info",
  Invoice: "bg-accent/10 text-accent",
};

const LOGS = [
  { ts: "Apr 5, 2026, 07:51 PM", ago: "6d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Logged Time", entity: "Time Entry", detail: "4h" },
  { ts: "Apr 5, 2026, 12:04 AM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Updated Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 11:59 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Updated Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 11:52 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Updated Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 11:04 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Updated Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 08:53 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Created Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 08:53 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Created Task", entity: "Task", detail: "-" },
  { ts: "Apr 4, 2026, 08:52 PM", ago: "7d ago", actor: "Lakshay Kapoor", email: "kapoorlakshay2002@gmail.com", action: "Created Task", entity: "Task", detail: "-" },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function HeroActivityLogsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="mb-3">
        <h2 className="text-base font-bold font-display text-foreground">Activity</h2>
        <p className="text-[11px] text-muted-foreground">Chronological activity across your organization</p>
      </div>

      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 max-w-[45%]">
          <Search size={10} className="text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/40">Search by action, actor, or entity...</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
            <Calendar size={9} /> Select dates... <ChevronDown size={8} />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] font-medium text-foreground">
            <Filter size={9} /> Filters
          </div>
          <div className="flex h-6 items-center gap-1 rounded-md bg-primary px-2.5 text-[10px] font-medium text-primary-foreground">
            <Download size={9} /> Export CSV
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["Timestamp", "Actor", "Action", "Entity", "Details", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LOGS.map((l, i) => (
              <motion.tr
                key={i}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="text-[10px] font-mono text-foreground">{l.ts}</div>
                  <div className="text-[9px] text-muted-foreground">{l.ago}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[6px] font-semibold text-primary">LK</div>
                    <div>
                      <div className="text-[10px] font-medium text-foreground">{l.actor}</div>
                      <div className="text-[9px] text-muted-foreground">{l.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-foreground">{l.action}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${ENTITY_STYLES[l.entity] ?? "bg-secondary text-muted-foreground"}`}>
                    {l.entity}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{l.detail}</td>
                <td className="px-4 py-2.5">
                  <Eye size={9} className="text-muted-foreground/30" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="Showing 1-10 of 70 results" />
      </div>
    </div>
  );
}
