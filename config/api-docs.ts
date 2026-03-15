import { Key, Globe, Lock, Webhook } from "lucide-react";

export const endpoints = [
  {
    method: "GET",
    path: "/api/v1/clients",
    desc: "List all clients in the organization.",
  },
  {
    method: "POST",
    path: "/api/v1/clients",
    desc: "Create a new client record.",
  },
  {
    method: "GET",
    path: "/api/v1/projects",
    desc: "List projects with optional filters.",
  },
  { method: "POST", path: "/api/v1/projects", desc: "Create a new project." },
  {
    method: "GET",
    path: "/api/v1/tasks",
    desc: "List tasks with status and assignee filters.",
  },
  {
    method: "PATCH",
    path: "/api/v1/tasks/:id",
    desc: "Update task status, assignee, or priority.",
  },
  {
    method: "GET",
    path: "/api/v1/billing/invoices",
    desc: "List invoices for the organization.",
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    desc: "Register a webhook endpoint.",
  },
];

export const features = [
  {
    icon: Key,
    title: "API Keys",
    desc: "Generate and manage API keys from your organization settings.",
  },
  {
    icon: Globe,
    title: "RESTful Design",
    desc: "Standard REST conventions with JSON request/response bodies.",
  },
  {
    icon: Lock,
    title: "OAuth 2.0",
    desc: "Secure token-based authentication for third-party integrations.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Real-time event notifications for task, project, and billing changes.",
  },
];
