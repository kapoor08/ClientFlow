import {
  BookOpen,
  Code,
  Server,
  Shield,
  Puzzle,
  Zap,
  Database,
} from "lucide-react";

export const sections = [
  {
    icon: Zap,
    title: "Quick Start",
    desc: "Get up and running in under 5 minutes with your first project.",
    link: "#",
  },
  {
    icon: BookOpen,
    title: "User Guides",
    desc: "Step-by-step guides for clients, projects, tasks, and billing.",
    link: "#",
  },
  {
    icon: Code,
    title: "API Reference",
    desc: "RESTful API with comprehensive endpoint documentation.",
    link: "/api-docs",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    desc: "Connect Slack, GitHub, Google Workspace, Zapier, and more.",
    link: "/integrations",
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    desc: "RBAC setup, SSO configuration, audit logging, and MFA.",
    link: "/security",
  },
  {
    icon: Database,
    title: "Data Management",
    desc: "Import/export, data retention, and backup procedures.",
    link: "#",
  },
  {
    icon: Server,
    title: "Architecture",
    desc: "Multi-tenant design, performance, and scaling guidelines.",
    link: "#",
  },
];
