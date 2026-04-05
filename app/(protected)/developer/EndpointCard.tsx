"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { ApiEndpoint, ApiParam, HttpMethod } from "./api-docs-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-info/10 text-info",
  POST: "bg-success/10 text-success",
  PATCH: "bg-warning/10 text-warning",
  PUT: "bg-warning/10 text-warning",
  DELETE: "bg-danger/10 text-danger",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded p-1 text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
      title="Copy"
    >
      {copied ? (
        <Check size={12} className="text-success" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

function ParamTable({ params }: { params: ApiParam[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/60">
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-32">
              Name
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-28">
              Type
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-20">
              Required
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={`${i < params.length - 1 ? "border-b border-border" : ""}`}
            >
              <td className="px-3 py-2">
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                  {p.name}
                </code>
              </td>
              <td className="px-3 py-2 font-mono text-info">{p.type}</td>
              <td className="px-3 py-2">
                {p.required ? (
                  <span className="rounded-pill bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                    required
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EndpointCard ─────────────────────────────────────────────────────────────

export function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <span className="flex-1 font-mono text-sm text-foreground">
          {endpoint.path}
        </span>
        <span className="hidden text-xs text-muted-foreground sm:block">
          {endpoint.summary}
        </span>
        {open ? (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-5 bg-secondary/[0.04]">
          {endpoint.description && (
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
          )}

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Query Parameters
              </p>
              <ParamTable params={endpoint.params} />
            </div>
          )}

          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Request Body
              </p>
              <ParamTable params={endpoint.body} />
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Response Example
                </p>
                <CopyButton text={endpoint.responseExample} />
              </div>
              <pre className="overflow-x-auto rounded-lg bg-secondary p-3 font-mono text-xs text-foreground leading-relaxed">
                {endpoint.responseExample}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
