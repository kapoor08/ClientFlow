import {
  BookOpen,
  MessageSquare,
  Video,
  FileText,
  Users,
  CreditCard,
} from "lucide-react";

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
    desc: "Creating projects, task workflows, Kanban boards.",
    count: 15,
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    desc: "Plans, invoices, payment methods, upgrades.",
    count: 10,
  },
  {
    icon: Video,
    title: "Integrations",
    desc: "Connecting Slack, GitHub, Google Workspace, and more.",
    count: 9,
  },
  {
    icon: MessageSquare,
    title: "Account & Security",
    desc: "SSO, MFA, roles, permissions, audit logs.",
    count: 11,
  },
];
