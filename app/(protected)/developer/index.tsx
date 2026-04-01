"use client";

import { Code2, Key } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { API_SECTIONS } from "./api-docs-data";
import { ApiDocsSidebar } from "./ApiDocsSidebar";
import { ApiSection } from "./ApiSection";

// ─── Page ─────────────────────────────────────────────────────────────────────

const ApiDocsPage = () => {
  const [activeSection, setActiveSection] = useQueryState(
    "section",
    parseAsString.withDefault("authentication"),
  );

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <ApiDocsSidebar
        sections={API_SECTIONS}
        activeSection={activeSection}
        onSelect={setActiveSection}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Code2 size={20} className="text-muted-foreground" />
            <h1 className="font-display text-2xl font-semibold text-foreground">API Reference</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            The ClientFlow REST API lets you manage your workspace programmatically.
          </p>
        </div>

        {/* Auth info */}
        <div className="mb-6 rounded-card border border-border bg-card p-4 shadow-cf-1">
          <div className="flex items-center gap-2 mb-2">
            <Key size={14} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Authentication</p>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Include your API key in the <code className="rounded bg-secondary px-1 py-0.5 font-mono">Authorization</code> header.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-foreground">
            <span className="flex-1">Authorization: Bearer cf_your_api_key_here</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Base URL: <code className="rounded bg-secondary px-1 py-0.5 font-mono">{typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}</code>
          </p>
        </div>

        {/* Mobile section selector */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/50 p-1 md:hidden">
          {API_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Section content */}
        {API_SECTIONS.filter((s) => s.id === activeSection).map((section) => (
          <ApiSection key={section.id} section={section} />
        ))}

        {/* Rate limits note */}
        <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-cf-1">
          <p className="text-sm font-semibold text-foreground mb-1">Rate Limits</p>
          <p className="text-xs text-muted-foreground">
            API requests are rate limited to <strong>1,000 requests per hour</strong> per API key.
            Exceeding this returns a <code className="rounded bg-secondary px-1 py-0.5 font-mono">429 Too Many Requests</code> response.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
