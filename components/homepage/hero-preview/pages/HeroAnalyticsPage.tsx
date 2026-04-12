"use client";

import { motion } from "framer-motion";
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
import { HERO_REVENUE_DATA } from "../data";

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

const barAnim = {
  hidden: { scaleY: 0 },
  show: (i: number) => ({
    scaleY: 1,
    transition: { delay: 0.3 + i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
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
          <h2 className="text-base font-bold font-display text-foreground">Analytics</h2>
          <p className="text-[11px] text-muted-foreground">Organizational performance overview</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-1 text-[10px] text-muted-foreground">
            <Calendar size={7} /> Select dates... <ChevronDown size={7} />
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-1 text-[10px] font-medium text-foreground">
            <Filter size={7} /> Filters
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="mb-1.5 grid grid-cols-5 gap-1.5">
        {KPI_ROW1.map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={kpiAnim} initial="hidden" animate="show" className="rounded-lg border border-border bg-card p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <Icon size={9} className="text-muted-foreground/40" />
            </div>
            <div className="mt-0.5 text-base font-bold text-foreground">{value}</div>
            <div className="text-[9px] text-muted-foreground">{desc}</div>
          </motion.div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="mb-3 grid grid-cols-5 gap-1.5">
        {KPI_ROW2.map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i + 5} variants={kpiAnim} initial="hidden" animate="show" className="rounded-lg border border-border bg-card p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <Icon size={9} className="text-muted-foreground/40" />
            </div>
            <div className="mt-0.5 text-base font-bold text-foreground">{value}</div>
            <div className="text-[9px] text-muted-foreground">{desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {/* Projects Created */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Projects Created</span>
            <span className="text-[9px] text-muted-foreground">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex flex-col items-center gap-0.5 w-16">
              <span className="text-[9px] font-medium text-foreground">2</span>
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="w-full rounded-t bg-violet-400 origin-bottom" style={{ height: 48 }} />
              <span className="text-[9px] text-muted-foreground">Mar 26</span>
            </div>
          </div>
        </motion.div>

        {/* Projects by Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Projects by Status</span>
            <span className="text-[9px] text-muted-foreground">2 total</span>
          </div>
          {PROJECT_STATUSES.map((s) => (
            <div key={s.label} className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[10px] text-foreground">{s.label}</span>
                <span className="text-[9px] text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.5, duration: 0.5 }} className={`h-full rounded-full ${s.color}`} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Revenue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Revenue</span>
            <span className="text-[9px] text-muted-foreground">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex flex-col items-center gap-0.5 w-16">
              <span className="text-[9px] font-medium text-foreground">$120</span>
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="w-full rounded-t bg-emerald-400 origin-bottom" style={{ height: 44 }} />
              <span className="text-[9px] text-muted-foreground">Apr 26</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* Tasks by Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Tasks by Status</span>
            <span className="text-[9px] text-muted-foreground">6 total</span>
          </div>
          {TASK_STATUSES.map((s) => (
            <div key={s.label} className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[10px] text-foreground">{s.label}</span>
                <span className="text-[9px] text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.6, duration: 0.5 }} className={`h-full rounded-full ${s.color}`} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Hours Logged */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Hours Logged</span>
            <span className="text-[9px] text-muted-foreground">All time</span>
          </div>
          <div className="flex h-16 items-end justify-center px-2">
            <div className="flex flex-col items-center gap-0.5 w-16">
              <span className="text-[9px] font-medium text-foreground">4h</span>
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="w-full rounded-t bg-cyan-400 origin-bottom" style={{ height: 40 }} />
              <span className="text-[9px] text-muted-foreground">Apr 26</span>
            </div>
          </div>
        </motion.div>

        {/* Invoices by Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Invoices by Status</span>
            <span className="text-[9px] text-muted-foreground">1 total</span>
          </div>
          <div className="mb-1.5">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[10px] text-foreground">Paid</span>
              <span className="text-[9px] text-muted-foreground">1 (100%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.7, duration: 0.5 }} className="h-full rounded-full bg-emerald-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
