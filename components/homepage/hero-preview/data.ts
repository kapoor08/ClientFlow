import {
  Activity,
  BarChart3,
  Bell,
  CheckSquare,
  Code2,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Navigation (mirrors config/navigation.ts) ─────────────────────────────

export type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const HERO_NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    label: "Work Management",
    items: [
      { icon: Users, label: "Clients", href: "/clients" },
      { icon: FolderKanban, label: "Projects", href: "/projects" },
      { icon: CheckSquare, label: "Tasks", href: "/tasks" },
      { icon: FileText, label: "Files", href: "/files" },
      { icon: Activity, label: "Activity Logs", href: "/activity-logs" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Bell, label: "Notifications", href: "/notifications" },
      { icon: UserPlus, label: "Invitations", href: "/invitations" },
    ],
  },
  {
    label: "Business",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/analytics" },
      { icon: Receipt, label: "Invoices", href: "/invoices" },
      { icon: CreditCard, label: "Billing", href: "/billing" },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: Settings, label: "Organization", href: "/settings" },
      { icon: Users, label: "Team & Roles", href: "/teams" },
      { icon: Shield, label: "Security", href: "/org-security" },
      { icon: Code2, label: "Developer", href: "/developer" },
    ],
  },
];

// Flat list for quick lookup
export const ALL_NAV_ITEMS = HERO_NAV_GROUPS.flatMap((g) => g.items);

// ─── Dashboard KPIs ─────────────────────────────────────────────────────────

export const HERO_KPIS = [
  {
    label: "Active Clients",
    value: "156",
    change: "+4 this month",
    icon: Users,
    trend: "up" as const,
  },
  {
    label: "Projects",
    value: "28",
    change: "3 due this week",
    icon: FolderKanban,
    trend: "neutral" as const,
  },
  {
    label: "Open Tasks",
    value: "142",
    change: "None overdue",
    icon: CheckSquare,
    trend: "up" as const,
  },
  {
    label: "Revenue",
    value: "$48.2K",
    change: "From paid invoices",
    icon: CreditCard,
    trend: "up" as const,
  },
];

// ─── Revenue Chart ──────────────────────────────────────────────────────────

export const HERO_REVENUE_DATA = [
  { month: "Jul", value: 28, label: "$2.8K" },
  { month: "Aug", value: 40, label: "$4.0K" },
  { month: "Sep", value: 32, label: "$3.2K" },
  { month: "Oct", value: 52, label: "$5.2K" },
  { month: "Nov", value: 60, label: "$6.0K" },
  { month: "Dec", value: 48, label: "$4.8K" },
  { month: "Jan", value: 65, label: "$6.5K" },
  { month: "Feb", value: 74, label: "$7.4K" },
  { month: "Mar", value: 58, label: "$5.8K" },
  { month: "Apr", value: 70, label: "$7.0K" },
  { month: "May", value: 80, label: "$8.0K" },
  { month: "Jun", value: 88, label: "$120" },
];

// ─── Recent Activity ────────────────────────────────────────────────────────

export const HERO_ACTIVITY = [
  { label: "Invoice #1082 paid", sub: "Acme Corp · 2h ago", dot: "bg-success" },
  { label: "New project created", sub: "Prop Firm Genie · 4h ago", dot: "bg-primary" },
  { label: "Task completed", sub: "Sprint Planning · 5h ago", dot: "bg-accent" },
  { label: "Client invited", sub: "Kevin Tu · 1d ago", dot: "bg-warning" },
];

// ─── Clients ────────────────────────────────────────────────────────────────

export const HERO_CLIENTS = [
  { name: "Acme Corporation", company: "Acme Corp", email: "contact@acme.com", status: "active" },
  { name: "Globex Industries", company: "Globex", email: "info@globex.com", status: "active" },
  { name: "Wayne Enterprises", company: "Wayne Ent.", email: "bruce@wayne.com", status: "active" },
  { name: "Stark Industries", company: "Stark Ind.", email: "tony@stark.com", status: "active" },
  { name: "Umbrella Corp", company: "Umbrella", email: "admin@umbrella.co", status: "inactive" },
  { name: "Oscorp Technologies", company: "Oscorp", email: "norman@oscorp.com", status: "active" },
];

// ─── Projects ───────────────────────────────────────────────────────────────

export const HERO_PROJECTS = [
  { name: "Website Redesign", client: "Acme Corp", status: "in_progress", priority: "high", due: "Apr 28" },
  { name: "Mobile App v2", client: "Globex", status: "in_progress", priority: "urgent", due: "May 5" },
  { name: "Brand Identity", client: "Wayne Ent.", status: "planning", priority: "medium", due: "May 12" },
  { name: "SEO Campaign", client: "Stark Ind.", status: "completed", priority: "low", due: "Apr 10" },
  { name: "Dashboard MVP", client: "Oscorp", status: "in_progress", priority: "high", due: "May 1" },
  { name: "API Integration", client: "Umbrella", status: "on_hold", priority: "medium", due: "May 20" },
];

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const HERO_TASKS = [
  { title: "Design homepage mockup", project: "Website Redesign", status: "in_progress", priority: "high" },
  { title: "API auth endpoint", project: "Mobile App v2", status: "todo", priority: "urgent" },
  { title: "Write copy for landing", project: "Brand Identity", status: "todo", priority: "medium" },
  { title: "Setup CI/CD pipeline", project: "Dashboard MVP", status: "in_review", priority: "high" },
  { title: "Keyword research", project: "SEO Campaign", status: "completed", priority: "low" },
  { title: "Create style guide", project: "Brand Identity", status: "in_progress", priority: "medium" },
];

// ─── Invoices ───────────────────────────────────────────────────────────────

export const HERO_INVOICES = [
  { number: "INV-1082", client: "Acme Corp", amount: "$4,500", status: "paid", date: "Apr 2" },
  { number: "INV-1083", client: "Globex", amount: "$8,200", status: "sent", date: "Apr 5" },
  { number: "INV-1084", client: "Wayne Ent.", amount: "$3,100", status: "draft", date: "Apr 8" },
  { number: "INV-1085", client: "Stark Ind.", amount: "$12,750", status: "paid", date: "Mar 28" },
  { number: "INV-1086", client: "Oscorp", amount: "$6,400", status: "overdue", date: "Mar 15" },
  { number: "INV-1087", client: "Umbrella", amount: "$2,900", status: "sent", date: "Apr 10" },
];

// ─── Notifications ──────────────────────────────────────────────────────────

export const HERO_NOTIFICATIONS = [
  { title: "Task assigned to you", body: "Design homepage mockup — Website Redesign", time: "2m ago", unread: true, type: "task_assigned" },
  { title: "Invoice #1082 paid", body: "Acme Corp paid $4,500", time: "2h ago", unread: true, type: "invite_accepted" },
  { title: "New comment on task", body: "Sarah: \"Looks great, approved!\"", time: "4h ago", unread: true, type: "task_comment_added" },
  { title: "Project deadline approaching", body: "Mobile App v2 — due in 3 days", time: "6h ago", unread: false, type: "task_due_soon" },
  { title: "Team member joined", body: "Alex joined as Developer", time: "1d ago", unread: false, type: "invite_accepted" },
];

// ─── Analytics KPIs ─────────────────────────────────────────────────────────

export const HERO_ANALYTICS_KPIS = [
  { label: "Active Clients", value: "156", icon: Users },
  { label: "Active Projects", value: "28", icon: FolderKanban },
  { label: "Completed", value: "94", icon: CheckSquare },
  { label: "Total Revenue", value: "$248K", icon: CreditCard },
  { label: "Total Tasks", value: "847", icon: CheckSquare },
  { label: "Hours Logged", value: "2,140", icon: Activity },
];

// ─── Status / Priority styling ──────────────────────────────────────────────

export const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-muted-foreground",
  archived: "bg-secondary text-muted-foreground",
  planning: "bg-info/10 text-info",
  in_progress: "bg-primary/10 text-primary",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  todo: "bg-secondary text-muted-foreground",
  in_review: "bg-violet-500/10 text-violet-600",
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  todo: "To Do",
  in_review: "In Review",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export const PRIORITY_STYLES: Record<string, { dot: string; text: string }> = {
  low: { dot: "bg-emerald-400", text: "text-emerald-600" },
  medium: { dot: "bg-amber-400", text: "text-amber-600" },
  high: { dot: "bg-orange-400", text: "text-orange-600" },
  urgent: { dot: "bg-red-500", text: "text-red-600" },
};
