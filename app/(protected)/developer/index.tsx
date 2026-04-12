"use client";

import { Code2, Key, AlertCircle } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/utils/cn";
import { API_SECTIONS, ApiDocsSidebar, ApiSection } from "@/components/developer";

// ─── Error codes table ────────────────────────────────────────────────────────

const ERROR_CODES = [
  { code: "400", label: "Bad Request", description: "Missing or invalid request parameters." },
  { code: "401", label: "Unauthorized", description: "Missing or invalid API key." },
  { code: "403", label: "Forbidden", description: "Valid key but insufficient permissions." },
  { code: "404", label: "Not Found", description: "The requested resource does not exist." },
  { code: "409", label: "Conflict", description: "Resource already exists or state conflict." },
  { code: "429", label: "Too Many Requests", description: "Rate limit exceeded (1,000 req/hour)." },
  { code: "500", label: "Server Error", description: "An unexpected error occurred on our end." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ApiDocsPage = () => {
  const [activeSection, setActiveSection] = useQueryState(
    "section",
    parseAsString.withDefault("authentication"),
  );

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://your-app.com";

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
          <div className="mb-1 flex items-center gap-2">
            <Code2 size={20} className="text-muted-foreground" />
            <h1 className="font-display text-2xl font-semibold text-foreground">
              API Reference
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            The ClientFlow REST API lets you manage your workspace programmatically.
          </p>
        </div>

        {/* Auth info */}
        <div className="mb-4 rounded-card border border-border bg-card p-4 shadow-cf-1">
          <div className="mb-3 flex items-center gap-2">
            <Key size={14} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Authentication</p>
          </div>

          <p className="mb-2 text-xs text-muted-foreground">
            Include your API key in the{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono">Authorization</code>{" "}
            header as a Bearer token. Keys can be created in{" "}
            <strong>Settings → API Keys</strong>.
          </p>

          <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-foreground">
            <span className="flex-1">Authorization: Bearer cf_your_api_key_here</span>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            Base URL:{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono">{baseUrl}</code>
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Example Request
          </p>
          <pre className="overflow-x-auto rounded-lg bg-secondary p-3 font-mono text-xs text-foreground leading-relaxed">{`curl -X GET "${baseUrl}/api/clients" \\
  -H "Authorization: Bearer cf_your_api_key_here" \\
  -H "Content-Type: application/json"`}</pre>
        </div>

        {/* Error codes */}
        <div className="mb-6 rounded-card border border-border bg-card shadow-cf-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <AlertCircle size={14} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Error Codes</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {ERROR_CODES.map((e, i) => (
                <tr
                  key={e.code}
                  className={i < ERROR_CODES.length - 1 ? "border-b border-border" : ""}
                >
                  <td className="px-4 py-2.5 w-12">
                    <code className="font-mono font-semibold text-foreground">{e.code}</code>
                  </td>
                  <td className="px-4 py-2.5 w-36 text-muted-foreground font-medium">
                    {e.label}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile section selector */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/50 p-1 md:hidden">
          {API_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
          <p className="mb-1 text-sm font-semibold text-foreground">Rate Limits</p>
          <p className="text-xs text-muted-foreground">
            API requests are rate limited to <strong>1,000 requests per hour</strong> per API
            key. Exceeding this returns a{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono">
              429 Too Many Requests
            </code>{" "}
            response. Contact support if you need a higher limit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
