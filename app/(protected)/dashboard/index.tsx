"use client";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";

const kpis = [
  {
    label: "Active Clients",
    value: "47",
    change: "+3 this month",
    icon: Users,
    trend: "up",
  },
  {
    label: "Projects in Progress",
    value: "23",
    change: "5 due this week",
    icon: FolderKanban,
    trend: "neutral",
  },
  {
    label: "Open Tasks",
    value: "156",
    change: "12 overdue",
    icon: CheckSquare,
    trend: "warning",
  },
  {
    label: "Monthly Revenue",
    value: "$42.8k",
    change: "+8.2% vs last month",
    icon: CreditCard,
    trend: "up",
  },
];

const recentTasks = [
  {
    title: "Update brand guidelines",
    project: "Acme Corp",
    status: "in_progress",
    priority: "high",
    due: "Today",
  },
  {
    title: "Review Q4 analytics report",
    project: "Globex Inc",
    status: "review",
    priority: "medium",
    due: "Tomorrow",
  },
  {
    title: "Deploy landing page v2",
    project: "Initech",
    status: "todo",
    priority: "high",
    due: "Mar 8",
  },
  {
    title: "Client feedback session",
    project: "Acme Corp",
    status: "todo",
    priority: "low",
    due: "Mar 9",
  },
  {
    title: "Invoice reconciliation",
    project: "Globex Inc",
    status: "blocked",
    priority: "medium",
    due: "Overdue",
  },
];

const statusColors: Record<string, string> = {
  todo: "bg-neutral-300 text-neutral-700",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
};

const Dashboard = () => {
  const motionStagger = useMotionStagger({
    step: 0.06,
    initialY: 12,
    duration: 0.35,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, Jane. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/projects/new">New Project</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/tasks">New Task</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={motionStagger.container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={motionStagger.item}
            className="rounded-card border border-border bg-card p-5 shadow-cf-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <kpi.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {kpi.value}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {kpi.trend === "up" && (
                <TrendingUp size={12} className="text-success" />
              )}
              {kpi.trend === "warning" && (
                <AlertCircle size={12} className="text-warning" />
              )}
              <span className="text-muted-foreground">{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Tasks */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Tasks Due Soon
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/tasks" className="flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Task
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Project
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr
                  key={task.title}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {task.title}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {task.project}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span
                      className={`flex items-center gap-1 text-xs ${task.due === "Overdue" ? "font-medium text-danger" : "text-muted-foreground"}`}
                    >
                      <Clock size={12} />
                      {task.due}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
