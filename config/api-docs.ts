import { Key, Globe, ShieldCheck, RefreshCcw } from "lucide-react";

/**
 * Public REST API surface (v1). Only endpoints that actually exist under
 * `app/api/v1/*` are listed here. Webhooks and OAuth are intentionally not
 * documented - both are on the roadmap, neither ships today.
 */
export const endpoints = [
  {
    method: "GET",
    path: "/api/v1/clients",
    desc: "List all clients in the organization with pagination.",
  },
  {
    method: "POST",
    path: "/api/v1/clients",
    desc: "Create a new client record. Plan limits are enforced server-side.",
  },
  {
    method: "GET",
    path: "/api/v1/projects",
    desc: "List projects with optional client and status filters.",
  },
  {
    method: "POST",
    path: "/api/v1/projects",
    desc: "Create a new project. Plan limits are enforced server-side.",
  },
  {
    method: "GET",
    path: "/api/v1/tasks",
    desc: "List tasks with status, assignee, and project filters.",
  },
  {
    method: "POST",
    path: "/api/v1/tasks",
    desc: "Create a new task. Counts against the monthly task-creation limit on metered plans.",
  },
  {
    method: "GET",
    path: "/api/v1/invoices",
    desc: "List invoices for the organization with status filters.",
  },
];

export const features = [
  {
    icon: Key,
    title: "API Keys",
    desc: "Generate and rotate organization-scoped API keys from Settings → Developer. Pass as a Bearer token.",
  },
  {
    icon: Globe,
    title: "RESTful Design",
    desc: "Predictable resource URLs, standard HTTP verbs, and JSON request and response bodies.",
  },
  {
    icon: ShieldCheck,
    title: "Rate Limiting",
    desc: "Per-key sliding-window limits. Quota and reset windows are returned in standard X-RateLimit-* headers.",
  },
  {
    icon: RefreshCcw,
    title: "Idempotency",
    desc: "Pass an Idempotency-Key header on POST requests to safely retry without creating duplicates.",
  },
];
