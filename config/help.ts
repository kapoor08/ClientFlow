import { BookOpen, MessageSquare, Bell, FileText, Users, CreditCard } from "lucide-react";

export const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    desc: "Setup guide, first project, inviting your team.",
    count: 12,
  },
  {
    icon: Users,
    title: "Client Management",
    desc: "Adding clients, contacts, and relationship tracking.",
    count: 8,
  },
  {
    icon: FileText,
    title: "Projects & Tasks",
    desc: "Creating projects, task workflows, kanban boards.",
    count: 15,
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    desc: "Plans, invoices, payment methods, upgrades.",
    count: 10,
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Email, in-app, and web push preferences and unsubscribes.",
    count: 6,
  },
  {
    icon: MessageSquare,
    title: "Account & Security",
    desc: "Two-factor auth, roles, permissions, audit logs, IP allowlists.",
    count: 11,
  },
];
