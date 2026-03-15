import {
  BarChart3,
  Bell,
  CheckSquare,
  CreditCard,
  FolderKanban,
  Shield,
  Users,
  Zap,
} from "lucide-react";

export const features = [
  {
    icon: Users,
    title: "Client Management",
    desc: "Centralized client records with relationship tracking and project linking.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: FolderKanban,
    title: "Project Delivery",
    desc: "Plan, track, and deliver projects with timelines, teams, and milestones.",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    icon: CheckSquare,
    title: "Task Workflows",
    desc: "Kanban boards and list views with status pipelines, assignments, and due dates.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    desc: "Stripe-powered billing with plan gating, invoices, and usage tracking.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Aggregated insights on project health, task velocity, and revenue trends.",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    desc: "Instant updates for assignments, status changes, mentions, and billing.",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    icon: Shield,
    title: "Security & RBAC",
    desc: "Role-based access control with audit trails, session management, and MFA.",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
  },
  {
    icon: Zap,
    title: "Multi-Tenant Architecture",
    desc: "Shared infrastructure with strict tenant isolation and scalable performance.",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
  },
];
