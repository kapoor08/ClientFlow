import { BookOpen, Code, Server, Shield, Activity, Zap, Database } from "lucide-react";

export const sections = [
  {
    icon: Zap,
    title: "Quick Start",
    desc: "Get up and running in under 5 minutes with your first project.",
    link: "/help",
  },
  {
    icon: BookOpen,
    title: "User Guides",
    desc: "Step-by-step guides for clients, projects, tasks, and billing.",
    link: "/help",
  },
  {
    icon: Code,
    title: "API Reference",
    desc: "REST API for clients, projects, tasks, and invoices. Bearer-token authenticated.",
    link: "/api-docs",
  },
  {
    icon: Shield,
    title: "Security & Access",
    desc: "RBAC setup, two-factor authentication, audit logging, and IP allowlists.",
    link: "/security",
  },
  {
    icon: Activity,
    title: "Status & Uptime",
    desc: "Live component states, incident history, and email subscriptions.",
    link: "/status",
  },
  {
    icon: Database,
    title: "Data Management",
    desc: "Account-owner data export and deletion from billing settings.",
    link: "/help",
  },
  {
    icon: Server,
    title: "Architecture",
    desc: "Multi-tenant design, plan limits, rate limiting, and the services we run on.",
    link: "/integrations",
  },
];
