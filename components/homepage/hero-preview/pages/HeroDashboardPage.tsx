"use client";

import { m as Motion } from "framer-motion";
import { ArrowUpRight, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { HERO_KPIS, HERO_REVENUE_DATA } from "../data";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const barVariants = {
  hidden: { scaleY: 0 },
  show: (i: number) => ({
    scaleY: 1,
    transition: { delay: 0.3 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const TASKS_DUE = [
  {
    title: "New task",
    project: "Prop Firm Genie",
    status: "To Do",
    statusStyle: "bg-secondary text-muted-foreground",
    due: "Overdue",
    dueStyle: "text-danger",
  },
];

const RECENT_PROJECTS = [
  {
    name: "Prop Firm Genie",
    client: "Kevin Tu",
    status: "In Progress",
    statusStyle: "bg-primary/10 text-primary",
    priority: "High",
    priorityStyle: "text-orange-600",
  },
  {
    name: "Invent Health",
    client: "Varun",
    status: "In Progress",
    statusStyle: "bg-primary/10 text-primary",
    priority: "High",
    priorityStyle: "text-orange-600",
  },
];

const RECENT_ACTIVITY_LIST = [
  { actor: "Lakshay Kapoor", action: "time_entry created", time: "6d ago" },
  { actor: "Lakshay Kapoor", action: "updated a task", time: "7d ago" },
  { actor: "Lakshay Kapoor", action: "updated a task", time: "7d ago" },
  { actor: "Lakshay Kapoor", action: "created a task", time: "7d ago" },
  { actor: "Lakshay Kapoor", action: "created a task", time: "7d ago" },
];

export function HeroDashboardPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-foreground text-base font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-[11px]">
            Welcome back, Lakshay. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="bg-primary text-primary-foreground flex h-7 items-center gap-1 rounded-md px-3 text-[11px] font-medium">
          New Project
        </div>
      </div>

      {/* KPI Cards */}
      <Motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-5 grid grid-cols-4 gap-3"
      >
        {HERO_KPIS.map(({ label, value, change, icon: Icon, trend }) => (
          <Motion.div
            key={label}
            variants={fadeItem}
            className="border-border bg-card hover:border-primary/20 rounded-lg border p-3.5 transition-all hover:shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
              <Icon size={15} className="text-muted-foreground/50" />
            </div>
            <div className="font-display text-foreground text-lg font-bold">{value}</div>
            <div className="mt-1 flex items-center gap-1">
              {trend === "up" && <TrendingUp size={11} className="text-success" />}
              {(trend as string) === "warning" && (
                <AlertCircle size={11} className="text-warning" />
              )}
              <span className="text-muted-foreground truncate text-[10px]">{change}</span>
            </div>
          </Motion.div>
        ))}
      </Motion.div>

      {/* Revenue Trend */}
      <Motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="border-border bg-card mb-5 rounded-lg border p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-muted-foreground" />
          <span className="text-foreground text-xs font-semibold">Revenue Trend</span>
          <span className="text-muted-foreground ml-auto text-[11px]">Last 6 months</span>
        </div>
        <div className="flex h-28 items-end gap-2">
          {HERO_REVENUE_DATA.slice(6).map((d, i) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-foreground text-[9px] font-medium">{d.label}</span>
              <Motion.div
                custom={i}
                variants={barVariants}
                initial="hidden"
                animate="show"
                className="bg-primary/70 hover:bg-primary w-full origin-bottom rounded-t transition-colors"
                style={{ height: `${Math.max((d.value / 88) * 80, 4)}px` }}
              />
              <span className="text-muted-foreground/60 text-[9px]">{d.month} 26</span>
            </div>
          ))}
        </div>
      </Motion.div>

      {/* Tasks Due Soon */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-display text-foreground text-sm font-bold">Tasks Due Soon</span>
          <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium">
            View All <ArrowUpRight size={10} />
          </div>
        </div>
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-border bg-secondary/50 border-b">
                {["Task", "Project", "Status", "Due"].map((h) => (
                  <th
                    key={h}
                    className="text-muted-foreground px-4 py-2 text-left text-[10px] font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TASKS_DUE.map((t) => (
                <tr
                  key={t.title}
                  className="border-border hover:bg-secondary/30 border-b last:border-0"
                >
                  <td className="text-foreground px-4 py-2.5 text-[11px] font-medium">{t.title}</td>
                  <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{t.project}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${t.statusStyle}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`flex items-center gap-1 text-[10px] font-medium ${t.dueStyle}`}
                    >
                      <AlertCircle size={10} />
                      {t.due}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Projects + Recent Activity side by side */}
      <div className="grid grid-cols-5 gap-4">
        {/* Recent Projects */}
        <div className="col-span-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-display text-foreground text-sm font-bold">Recent Projects</span>
            <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium">
              View All <ArrowUpRight size={10} />
            </div>
          </div>
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-border bg-secondary/50 border-b">
                  {["Project", "Client", "Status", "Priority", "Due"].map((h) => (
                    <th
                      key={h}
                      className="text-muted-foreground px-4 py-2 text-left text-[10px] font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_PROJECTS.map((p) => (
                  <tr
                    key={p.name}
                    className="border-border hover:bg-secondary/30 border-b last:border-0"
                  >
                    <td className="text-foreground px-4 py-2.5 text-[11px] font-medium">
                      {p.name}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{p.client}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${p.statusStyle}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-medium ${p.priorityStyle}`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-[10px]">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity - limited to 5 */}
        <div className="col-span-2">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-display text-foreground flex items-center gap-1.5 text-sm font-bold">
              <Activity size={13} />
              Recent Activity
            </span>
            <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium">
              View All <ArrowUpRight size={10} />
            </div>
          </div>
          <div className="border-border bg-card rounded-lg border px-4 py-1">
            {RECENT_ACTIVITY_LIST.map((a, i) => (
              <Motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="border-border flex items-start gap-2.5 border-b py-2.5 last:border-0"
              >
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold">
                  LK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-[11px]">
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="text-muted-foreground text-[9px]">{a.time}</p>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
