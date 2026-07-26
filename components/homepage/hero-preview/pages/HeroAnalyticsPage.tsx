"use client";

import { m as Motion } from "framer-motion";
import {
  AlertTriangle,
  CheckSquare,
  CircleCheck,
  Clock,
  DollarSign,
  FileUp,
  FolderKanban,
  ListTodo,
  ReceiptText,
  Users,
  Calendar,
  ChevronDown,
  Filter,
} from "lucide-react";

const KPI_ROW1 = [
  { icon: Users, label: "Active Clients", value: "12", desc: "Clients with active status" },
  { icon: FolderKanban, label: "Active Projects", value: "2", desc: "Active & in-progress" },
  { icon: CheckSquare, label: "Completed", value: "0", desc: "Projects completed" },
  { icon: FileUp, label: "Files Uploaded", value: "2", desc: "Across all projects" },
  { icon: DollarSign, label: "Total Revenue", value: "$120.00", desc: "Paid invoices" },
];

const KPI_ROW2 = [
  { icon: ListTodo, label: "Total Tasks", value: "6", desc: "All tasks across projects" },
  { icon: CircleCheck, label: "Tasks Completed", value: "1", desc: "17% completion rate" },
  { icon: AlertTriangle, label: "Overdue Tasks", value: "1", desc: "Past due, not done" },
  { icon: Clock, label: "Hours Logged", value: "4h", desc: "Total time tracked" },
  { icon: ReceiptText, label: "Pending Revenue", value: "$0.00", desc: "Sent & draft invoices" },
];

const kpiAnim = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25 } }),
};

const PROJECT_STATUSES = [
  { label: "In Progress", count: "2 (100%)", pct: 100, color: "bg-primary" },
];

const TASK_STATUSES = [
  { label: "To Do", count: "5 (83%)", pct: 83, color: "bg-primary" },
  { label: "Done", count: "1 (17%)", pct: 17, color: "bg-success" },
];

export function HeroAnalyticsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between">
        <div>
          <h2 className="font-display text-foreground text-base font-bold">Analytics</h2>
          <p className="text-muted-foreground text-[11px]">Organizational performance overview</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="border-border bg-background text-muted-foreground flex items-center gap-0.5 rounded-md border px-1.5 py-1 text-[10px]">
            <Calendar size={7} /> Select dates... <ChevronDown size={7} />
          </div>
          <div className="border-border bg-background text-foreground flex items-center gap-0.5 rounded-md border px-1.5 py-1 text-[10px] font-medium">
            <Filter size={7} /> Filters
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="mb-1.5 grid grid-cols-5 gap-1.5">
        {KPI_ROW1.map(({ icon: Icon, label, value, desc }, i) => (
          <Motion.div
            key={label}
            custom={i}
            variants={kpiAnim}
            initial="hidden"
            animate="show"
            className="border-border bg-card rounded-lg border p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">{label}</span>
              <Icon size={9} className="text-muted-foreground/40" />
            </div>
            <div className="text-foreground mt-0.5 text-base font-bold">{value}</div>
            <div className="text-muted-foreground text-[9px]">{desc}</div>
          </Motion.div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="mb-3 grid grid-cols-5 gap-1.5">
        {KPI_ROW2.map(({ icon: Icon, label, value, desc }, i) => (
          <Motion.div
            key={label}
            custom={i + 5}
            variants={kpiAnim}
            initial="hidden"
            animate="show"
            className="border-border bg-card rounded-lg border p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">{label}</span>
              <Icon size={9} className="text-muted-foreground/40" />
            </div>
            <div className="text-foreground mt-0.5 text-base font-bold">{value}</div>
            <div className="text-muted-foreground text-[9px]">{desc}</div>
          </Motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {/* Projects Created */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Projects Created</span>
            <span className="text-muted-foreground text-[9px]">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex w-16 flex-col items-center gap-0.5">
              <span className="text-foreground text-[9px] font-medium">2</span>
              <Motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full origin-bottom rounded-t bg-violet-400"
                style={{ height: 48 }}
              />
              <span className="text-muted-foreground text-[9px]">Mar 26</span>
            </div>
          </div>
        </Motion.div>

        {/* Projects by Status */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Projects by Status</span>
            <span className="text-muted-foreground text-[9px]">2 total</span>
          </div>
          {PROJECT_STATUSES.map((s) => (
            <div key={s.label} className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-foreground text-[10px]">{s.label}</span>
                <span className="text-muted-foreground text-[9px]">{s.count}</span>
              </div>
              <div className="bg-secondary h-1.5 rounded-full">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className={`h-full rounded-full ${s.color}`}
                />
              </div>
            </div>
          ))}
        </Motion.div>

        {/* Revenue */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Revenue</span>
            <span className="text-muted-foreground text-[9px]">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex w-16 flex-col items-center gap-0.5">
              <span className="text-foreground text-[9px] font-medium">$120</span>
              <Motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="w-full origin-bottom rounded-t bg-emerald-400"
                style={{ height: 44 }}
              />
              <span className="text-muted-foreground text-[9px]">Apr 26</span>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* Tasks by Status */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Tasks by Status</span>
            <span className="text-muted-foreground text-[9px]">6 total</span>
          </div>
          {TASK_STATUSES.map((s) => (
            <div key={s.label} className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-foreground text-[10px]">{s.label}</span>
                <span className="text-muted-foreground text-[9px]">{s.count}</span>
              </div>
              <div className="bg-secondary h-1.5 rounded-full">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className={`h-full rounded-full ${s.color}`}
                />
              </div>
            </div>
          ))}
        </Motion.div>

        {/* Hours Logged */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Hours Logged</span>
            <span className="text-muted-foreground text-[9px]">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex w-16 flex-col items-center gap-0.5">
              <span className="text-foreground text-[9px] font-medium">4h</span>
              <Motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full origin-bottom rounded-t bg-cyan-400"
                style={{ height: 40 }}
              />
              <span className="text-muted-foreground text-[9px]">Apr 26</span>
            </div>
          </div>
        </Motion.div>

        {/* Invoices by Status */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="border-border bg-card rounded-lg border p-2.5"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-foreground text-[11px] font-semibold">Invoices by Status</span>
            <span className="text-muted-foreground text-[9px]">1 total</span>
          </div>
          <div className="mb-1.5">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-foreground text-[10px]">Paid</span>
              <span className="text-muted-foreground text-[9px]">1 (100%)</span>
            </div>
            <div className="bg-secondary h-1.5 rounded-full">
              <Motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
