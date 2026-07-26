"use client";

import { m as Motion } from "framer-motion";
import { AlertCircle, Code2, Key } from "lucide-react";

const API_SECTIONS = [
  { label: "Authentication", count: 4, active: true },
  { label: "Clients", count: 5 },
  { label: "Projects", count: 5 },
  { label: "Tasks", count: 5 },
  { label: "Invoices", count: 5 },
  { label: "Webhooks", count: 4 },
];

const ERROR_CODES = [
  { code: "400", label: "Bad Request", desc: "Missing or invalid request parameters." },
  { code: "401", label: "Unauthorized", desc: "Missing or invalid API key." },
  { code: "403", label: "Forbidden", desc: "Valid key but insufficient permissions." },
  { code: "404", label: "Not Found", desc: "The requested resource does not exist." },
  { code: "409", label: "Conflict", desc: "Resource already exists or state conflict." },
  { code: "429", label: "Too Many Requests", desc: "Rate limit exceeded (1,000 req/hour)." },
  { code: "500", label: "Server Error", desc: "An unexpected error occurred on our end." },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/api-keys", label: "List API keys", color: "bg-emerald-500" },
  { method: "POST", path: "/api/api-keys", label: "Create API key", color: "bg-blue-500" },
  {
    method: "PATCH",
    path: "/api/api-keys/{keyId}",
    label: "Revoke API key",
    color: "bg-amber-500",
  },
  { method: "DELETE", path: "/api/api-keys/{keyId}", label: "Delete API key", color: "bg-red-500" },
];

export function HeroDeveloperPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="flex gap-3">
        {/* API sidebar */}
        <Motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-24 shrink-0"
        >
          <p className="text-muted-foreground/50 mb-1 px-1 text-[10px] font-bold tracking-widest uppercase">
            Reference
          </p>
          <div className="space-y-px">
            {API_SECTIONS.map(({ label, count, active }) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
                <span className="text-muted-foreground/50 text-[9px]">{count}</span>
              </div>
            ))}
          </div>
        </Motion.div>

        {/* Content */}
        <Motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-w-0 flex-1"
        >
          <div className="mb-0.5 flex items-center gap-1">
            <Code2 size={11} className="text-primary" />
            <h2 className="font-display text-foreground text-base font-bold">API Reference</h2>
          </div>
          <p className="text-muted-foreground mb-3 text-[11px]">
            The ClientFlow REST API lets you manage your workspace programmatically.
          </p>

          {/* Auth card */}
          <div className="border-border bg-card mb-2 rounded-lg border p-2.5">
            <div className="mb-1 flex items-center gap-1">
              <Key size={8} className="text-muted-foreground" />
              <span className="text-foreground text-xs font-bold">Authentication</span>
            </div>
            <p className="text-muted-foreground mb-1.5 text-[10px]">
              Include your API key in the Authorization header as a Bearer token.
            </p>
            <div className="bg-secondary text-foreground rounded-md px-2 py-1 font-mono text-[10px]">
              Authorization: Bearer cf_your_api_key_here
            </div>
            <p className="text-muted-foreground mt-1 text-[9px]">Base URL: http://localhost:3000</p>
            <div className="bg-foreground/5 mt-1.5 rounded-md p-2">
              <p className="text-muted-foreground mb-0.5 text-[9px] font-bold uppercase">
                Example Request
              </p>
              <pre className="text-foreground font-mono text-[9px] leading-relaxed">
                {`curl -X GET "http://localhost:3000/api/clients" \\
  -H "Authorization: Bearer cf_your_api_key_here" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>

          {/* Error Codes */}
          <div className="border-border bg-card mb-2 rounded-lg border p-2.5">
            <div className="mb-1.5 flex items-center gap-1">
              <AlertCircle size={8} className="text-muted-foreground" />
              <span className="text-foreground text-xs font-bold">Error Codes</span>
            </div>
            <div className="space-y-0">
              {ERROR_CODES.map((e) => (
                <div
                  key={e.code}
                  className="border-border flex items-baseline gap-2 border-b py-1 last:border-0"
                >
                  <span className="text-foreground w-6 font-mono text-[10px] font-bold">
                    {e.code}
                  </span>
                  <span className="text-foreground w-20 text-[10px] font-medium">{e.label}</span>
                  <span className="text-muted-foreground text-[9px]">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints */}
          <h3 className="text-foreground mb-1 text-xs font-bold">Authentication</h3>
          <div className="space-y-1">
            {ENDPOINTS.map((ep) => (
              <div
                key={ep.path + ep.method}
                className="border-border bg-card flex items-center justify-between rounded-lg border px-2.5 py-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded px-1 py-px text-[9px] font-bold text-white ${ep.color}`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-foreground font-mono text-[11px]">{ep.path}</span>
                </div>
                <span className="text-muted-foreground text-[10px]">{ep.label}</span>
              </div>
            ))}
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
