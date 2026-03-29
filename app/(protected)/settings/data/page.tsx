"use client";

import { useState } from "react";
import {
  Download,
  Users,
  FolderKanban,
  CheckSquare,
  Receipt,
  UserCog,
  Database,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ExportItem = {
  label: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
  filename: string;
};

const EXPORTS: ExportItem[] = [
  {
    label: "Clients",
    description: "All client records including contact info and status.",
    icon: Users,
    endpoint: "/api/exports/clients",
    filename: "clients.csv",
  },
  {
    label: "Projects",
    description: "All projects with status, priority, and dates.",
    icon: FolderKanban,
    endpoint: "/api/exports/projects",
    filename: "projects.csv",
  },
  {
    label: "Tasks",
    description: "All tasks across every project.",
    icon: CheckSquare,
    endpoint: "/api/exports/tasks",
    filename: "tasks.csv",
  },
  {
    label: "Invoices",
    description: "Billing history including amounts and payment status.",
    icon: Receipt,
    endpoint: "/api/exports/invoices",
    filename: "invoices.csv",
  },
  {
    label: "Team Members",
    description: "Organization members with roles and join dates.",
    icon: UserCog,
    endpoint: "/api/exports/team",
    filename: "team.csv",
  },
];

function ExportRow({ item }: { item: ExportItem }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch(item.endpoint);
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
      toast.success(`${item.label} exported successfully.`);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      toast.error(`Failed to export ${item.label.toLowerCase()}.`);
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <item.icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={state === "loading"}
        className={state === "error" ? "border-danger/50 text-danger" : ""}
      >
        {state === "loading" ? (
          <><Loader2 size={13} className="mr-1.5 animate-spin" /> Exporting…</>
        ) : state === "done" ? (
          <><Check size={13} className="mr-1.5 text-success" /> Downloaded</>
        ) : state === "error" ? (
          "Error"
        ) : (
          <><Download size={13} className="mr-1.5" /> Export CSV</>
        )}
      </Button>
    </div>
  );
}

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Data Export
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download your organization&apos;s data as CSV files.
        </p>
      </div>

      {/* Export section */}
      <div className="rounded-card border border-border bg-card shadow-cf-1">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <Database size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Export Data</h2>
        </div>
        <div className="divide-y divide-border">
          {EXPORTS.map((item) => (
            <ExportRow key={item.label} item={item} />
          ))}
        </div>
      </div>

      {/* GDPR note */}
      <div className="rounded-card border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Data Retention &amp; GDPR
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Exported files contain personal data. Handle them in accordance with your
              data protection obligations. For account deletion or data erasure requests,
              contact your administrator or reach out to our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
