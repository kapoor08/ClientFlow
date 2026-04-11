"use client";

import { Badge } from "@/components/ui/badge";
import type { EmailTemplate } from "@/data/emailTemplates";
import { ChevronDown, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig: Record<string, { label: string; className: string }> = {
  P0: {
    label: "P0 - Critical",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  P1: {
    label: "P1 - Important",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  P2: {
    label: "P2 - Nice to have",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const statusConfig: Record<string, { className: string }> = {
  Required: {
    className: "bg-destructive/8 text-destructive border-destructive/20",
  },
  Recommended: { className: "bg-primary/8 text-primary border-primary/20" },
  Conditional: { className: "bg-muted text-muted-foreground border-border" },
};

const phaseConfig: Record<number, string> = {
  1: "Core Safety",
  2: "Workflow",
  3: "Ops Maturity",
};

export function EmailTemplateCard({ template }: { template: EmailTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySlug = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigator.clipboard.writeText(template.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        expanded
          ? "border-primary/30 bg-card shadow-lg shadow-primary/5"
          : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div
          className={`h-10 w-1 shrink-0 rounded-full ${
            template.priority === "P0"
              ? "bg-destructive"
              : template.priority === "P1"
                ? "bg-warning"
                : "bg-border"
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate font-display text-[13px] font-semibold leading-tight text-foreground">
              {template.subject}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySlug}
              className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
              {template.slug}
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          <Badge
            variant="outline"
            className={`h-5 px-1.5 text-[10px] font-medium ${priorityConfig[template.priority].className}`}
          >
            {template.priority}
          </Badge>
          <Badge
            variant="outline"
            className={`h-5 px-1.5 text-[10px] font-medium ${statusConfig[template.status].className}`}
          >
            {template.status}
          </Badge>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5">
                <MetaItem label="Module" value={template.module} />
                <Divider />
                <MetaItem label="Audience" value={template.audience} />
                <Divider />
                <MetaItem
                  label="Phase"
                  value={`${template.phase} - ${phaseConfig[template.phase]}`}
                />
              </div>

              <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-background px-4 py-3">
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Trigger
                  </p>
                  <p className="text-xs text-foreground">{template.trigger}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/40" />
                  <div className="ml-3 flex-1 truncate rounded-md bg-muted/60 px-3 py-1 text-[10px] text-muted-foreground">
                    mail.clientflow.io - {template.subject}
                  </div>
                </div>

                <div className="bg-muted/20 px-6 py-8">
                  <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-white shadow-md">
                    <div className="bg-primary/5 px-8 py-6 text-center">
                      <span className="font-display text-2xl font-bold text-primary tracking-tight">
                        ClientFlow
                      </span>
                    </div>
                    <div className="h-px bg-border" />

                    <div className="space-y-4 px-8 py-7 font-body text-[13px] leading-relaxed text-foreground">
                      {template.previewBody
                        .split(/\[([^\]]+)\]\(([^)]+)\)/g)
                        .map((part, index) => {
                          if (index % 3 === 1) {
                            return (
                              <div key={index} className="py-1">
                                <span className="inline-block rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm">
                                  {part}
                                </span>
                              </div>
                            );
                          }

                          if (index % 3 === 2) {
                            return null;
                          }

                          return (
                            <span key={index} className="whitespace-pre-line">
                              {part.split(/(\{\{[^}]+\}\})/g).map((chunk, i) =>
                                chunk.startsWith("{{") && chunk.endsWith("}}") ? (
                                  <span key={i} className="text-primary font-medium">
                                    {chunk}
                                  </span>
                                ) : (
                                  chunk
                                ),
                              )}
                            </span>
                          );
                        })}
                    </div>

                    <div className="h-px bg-border" />
                    <div className="bg-muted/30 px-8 py-4 text-center">
                      <p className="text-[11px] text-muted-foreground">
                        © 2026 ClientFlow - All rights reserved
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Template Variables
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((variable) => (
                    <code
                      key={variable}
                      className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground"
                    >
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Divider() {
  return <span className="text-border">-</span>;
}
