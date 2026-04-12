"use client";

import { motion } from "framer-motion";
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
  { method: "PATCH", path: "/api/api-keys/{keyId}", label: "Revoke API key", color: "bg-amber-500" },
  { method: "DELETE", path: "/api/api-keys/{keyId}", label: "Delete API key", color: "bg-red-500" },
];

export function HeroDeveloperPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="flex gap-3">
        {/* API sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-24 shrink-0"
        >
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Reference</p>
          <div className="space-y-px">
            {API_SECTIONS.map(({ label, count, active }) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
                <span className="text-[9px] text-muted-foreground/50">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-1 mb-0.5">
            <Code2 size={11} className="text-primary" />
            <h2 className="text-base font-bold font-display text-foreground">API Reference</h2>
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">The ClientFlow REST API lets you manage your workspace programmatically.</p>

          {/* Auth card */}
          <div className="mb-2 rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Key size={8} className="text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Authentication</span>
            </div>
            <p className="mb-1.5 text-[10px] text-muted-foreground">Include your API key in the Authorization header as a Bearer token.</p>
            <div className="rounded-md bg-secondary px-2 py-1 text-[10px] font-mono text-foreground">
              Authorization: Bearer cf_your_api_key_here
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">Base URL: http://localhost:3000</p>
            <div className="mt-1.5 rounded-md bg-foreground/5 p-2">
              <p className="text-[9px] font-bold uppercase text-muted-foreground mb-0.5">Example Request</p>
              <pre className="text-[9px] font-mono text-foreground leading-relaxed">
{`curl -X GET "http://localhost:3000/api/clients" \\
  -H "Authorization: Bearer cf_your_api_key_here" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>

          {/* Error Codes */}
          <div className="mb-2 rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center gap-1 mb-1.5">
              <AlertCircle size={8} className="text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Error Codes</span>
            </div>
            <div className="space-y-0">
              {ERROR_CODES.map((e) => (
                <div key={e.code} className="flex items-baseline gap-2 border-b border-border py-1 last:border-0">
                  <span className="w-6 text-[10px] font-mono font-bold text-foreground">{e.code}</span>
                  <span className="w-20 text-[10px] font-medium text-foreground">{e.label}</span>
                  <span className="text-[9px] text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints */}
          <h3 className="mb-1 text-xs font-bold text-foreground">Authentication</h3>
          <div className="space-y-1">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path + ep.method} className="flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1 py-px text-[9px] font-bold text-white ${ep.color}`}>{ep.method}</span>
                  <span className="text-[11px] font-mono text-foreground">{ep.path}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{ep.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
