"use client";

import {
  Bell,
  Briefcase,
  CheckSquare,
  DollarSign,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Clients" },
  { icon: FolderKanban, label: "Projects" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: FileText, label: "Invoices" },
];

const KPI_CARDS = [
  {
    label: "Active Clients",
    value: "156",
    icon: Briefcase,
    trend: "+4 this month",
    color: "text-primary",
  },
  {
    label: "Projects",
    value: "28",
    icon: FolderKanban,
    trend: "3 due this week",
    color: "text-accent",
  },
  {
    label: "Open Tasks",
    value: "142",
    icon: CheckSquare,
    trend: "None overdue",
    color: "text-info",
  },
  {
    label: "Revenue",
    value: "$48.2K",
    icon: DollarSign,
    trend: "From paid invoices",
    color: "text-success",
  },
];

const BAR_HEIGHTS = [28, 40, 32, 52, 60, 48, 65, 74, 58, 70, 80, 88];

const RECENT_ACTIVITY = [
  { label: "Invoice #1082 paid", sub: "Acme Corp · 2h ago", dot: "bg-success" },
  {
    label: "New project created",
    sub: "Prop Firm Genie · 4h ago",
    dot: "bg-primary",
  },
  {
    label: "Task completed",
    sub: "Sprint Planning · 5h ago",
    dot: "bg-accent",
  },
  { label: "Client invited", sub: "Kevin Tu · 1d ago", dot: "bg-warning" },
];

const CHART_MONTHS = ["Jan", "Apr", "Jul", "Oct", "Dec"];

export default function HeroDashboardPreview() {
  return (
    <div className="mockup-frame overflow-hidden">
      <div className="mockup-dots">
        <span />
        <span />
        <span />
        <div className="ml-3 flex h-5 flex-1 items-center rounded-full bg-secondary px-3">
          <div className="h-1.5 w-24 rounded-full bg-border" />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-4 w-14 rounded bg-secondary" />
          <div className="h-4 w-10 rounded bg-secondary" />
        </div>
      </div>

      <div className="flex h-85 md:h-100">
        <aside className="flex w-36 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="flex h-10 items-center gap-2 border-b border-border px-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary-foreground opacity-80" />
            </div>
            <div className="h-2 w-16 rounded-full bg-border" />
          </div>

          <nav className="flex-1 space-y-0.5 p-2">
            {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/50"
                }`}
              >
                <Icon size={11} className="shrink-0" />
                {label}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <div className="h-5 w-5 shrink-0 rounded-full bg-primary/20" />
            <div className="space-y-0.5">
              <div className="h-1.5 w-12 rounded-full bg-border" />
              <div className="h-1 w-16 rounded-full bg-border/60" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1">
              <Search size={10} className="text-muted-foreground" />
              <div className="h-1.5 w-20 rounded-full bg-border" />
              <div className="ml-2 rounded border border-border px-1 text-[8px] text-muted-foreground/60">
                ⌘K
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-secondary">
                <Bell size={10} className="text-muted-foreground" />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                LK
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="h-3 w-24 rounded-full bg-foreground/80" />
                <div className="mt-1 h-2 w-36 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="h-6 w-20 rounded-lg bg-primary" />
            </div>

            <div className="mb-3 grid grid-cols-4 gap-2">
              {KPI_CARDS.map(({ label, value, icon: Icon, trend, color }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card p-2.5"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[8px] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </div>
                    <Icon size={10} className={color} />
                  </div>
                  <div className="font-display text-sm font-bold text-foreground">
                    {value}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <TrendingUp size={7} className="text-success" />
                    <div className="truncate text-[7px] text-muted-foreground">
                      {trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Revenue Trend
                  </div>
                  <div className="rounded-full bg-success/10 px-1.5 py-0.5 text-[7px] font-medium text-success">
                    +18% this month
                  </div>
                </div>
                <div className="flex h-20 items-end gap-1">
                  {BAR_HEIGHTS.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${height}%`,
                        background:
                          "linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.35))",
                        opacity:
                          i === BAR_HEIGHTS.length - 1
                            ? 1
                            : 0.7 + (i / BAR_HEIGHTS.length) * 0.3,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between">
                  {CHART_MONTHS.map((month) => (
                    <div
                      key={month}
                      className="text-[7px] text-muted-foreground/50"
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {RECENT_ACTIVITY.map(({ label, sub, dot }) => (
                    <div key={label} className="flex items-start gap-1.5">
                      <div
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
                      />
                      <div>
                        <div className="leading-tight text-[8px] font-medium text-foreground">
                          {label}
                        </div>
                        <div className="text-[7px] text-muted-foreground">
                          {sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
