import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";

const metrics = [
  {
    label: "Total Revenue",
    value: "$128,400",
    change: "+12.3%",
    up: true,
    icon: DollarSign,
  },
  {
    label: "Active Projects",
    value: "23",
    change: "+3",
    up: true,
    icon: FolderKanban,
  },
  {
    label: "Task Completion Rate",
    value: "78%",
    change: "+5.2%",
    up: true,
    icon: CheckSquare,
  },
  { label: "Active Clients", value: "47", change: "+2", up: true, icon: Users },
];

const projectPerf = [
  { name: "Website Redesign", tasks: 32, completed: 21, velocity: "High" },
  { name: "Mobile App MVP", tasks: 48, completed: 19, velocity: "Medium" },
  { name: "Brand Identity", tasks: 16, completed: 2, velocity: "Low" },
  { name: "SEO Optimization", tasks: 20, completed: 16, velocity: "High" },
  { name: "E-commerce Platform", tasks: 64, completed: 35, velocity: "Medium" },
];

const revenueData = [
  { month: "Oct", revenue: 18200 },
  { month: "Nov", revenue: 21500 },
  { month: "Dec", revenue: 24800 },
  { month: "Jan", revenue: 22100 },
  { month: "Feb", revenue: 28900 },
  { month: "Mar", revenue: 32900 },
];

const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

const AnalyticsPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.06,
    initialY: 12,
    duration: 0.35,
  });
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Organizational performance overview
        </p>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={motionStagger.container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {metrics.map((m) => (
          <motion.div
            key={m.label}
            variants={motionStagger.item}
            className="rounded-card border border-border bg-card p-5 shadow-cf-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {m.label}
              </span>
              <m.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {m.value}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {m.up ? (
                <ArrowUpRight size={12} className="text-success" />
              ) : (
                <ArrowDownRight size={12} className="text-danger" />
              )}
              <span className={m.up ? "text-success" : "text-danger"}>
                {m.change}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Revenue Trend
            </h2>
          </div>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {revenueData.map((d) => (
              <div
                key={d.month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] font-medium text-foreground">
                  ${(d.revenue / 1000).toFixed(1)}k
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${(d.revenue / maxRevenue) * 160}px` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {d.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Performance */}
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Project Performance
            </h2>
          </div>
          <div className="space-y-3">
            {projectPerf.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.completed}/{p.tasks}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(p.completed / p.tasks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
