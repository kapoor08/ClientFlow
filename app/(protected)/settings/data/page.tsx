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
  Shield,
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
    <div className="border-border flex items-center justify-between border-b px-5 py-4 last:border-0">
      <div className="flex items-center gap-4">
        <div className="bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <item.icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{item.label}</p>
          <p className="text-muted-foreground text-xs">{item.description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={state === "loading"}
        className={
          state === "error" ? "border-danger/50 text-danger cursor-pointer" : "cursor-pointer"
        }
      >
        {state === "loading" ? (
          <>
            <Loader2 size={13} className="mr-1.5 animate-spin" /> Exporting…
          </>
        ) : state === "done" ? (
          <>
            <Check size={13} className="text-success mr-1.5" /> Downloaded
          </>
        ) : state === "error" ? (
          "Error"
        ) : (
          <>
            <Download size={13} className="mr-1.5" /> Export CSV
          </>
        )}
      </Button>
    </div>
  );
}

function PersonalDataSection() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch("/api/settings/my-data-export");
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fromHeader = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1];
      a.download = fromHeader ?? "clientflow-personal-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
      toast.success("Your data export is ready.");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      toast.error("Failed to export your data.");
    }
  }

  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border">
      <div className="border-border flex items-center gap-2 border-b px-5 py-3.5">
        <Shield size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Your personal data (GDPR)</h2>
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Download size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Download my data</p>
            <p className="text-muted-foreground text-xs">
              A JSON file containing your account, sessions, notifications, memberships, and
              anything you&apos;ve authored. Security-sensitive fields (tokens, 2FA secrets) are
              redacted.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={state === "loading"}
          className={
            state === "error" ? "border-danger/50 text-danger cursor-pointer" : "cursor-pointer"
          }
        >
          {state === "loading" ? (
            <>
              <Loader2 size={13} className="mr-1.5 animate-spin" /> Preparing…
            </>
          ) : state === "done" ? (
            <>
              <Check size={13} className="text-success mr-1.5" /> Downloaded
            </>
          ) : state === "error" ? (
            "Error"
          ) : (
            <>
              <Download size={13} className="mr-1.5" /> Download JSON
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-foreground text-2xl font-semibold">Data Export</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Download your personal data or your organization&apos;s data.
        </p>
      </div>

      {/* GDPR personal-data section (Article 20) */}
      <PersonalDataSection />

      {/* Org-scoped CSV exports */}
      <div className="rounded-card border-border bg-card shadow-cf-1 border">
        <div className="border-border flex items-center gap-2 border-b px-5 py-3.5">
          <Database size={16} className="text-muted-foreground" />
          <h2 className="text-foreground text-sm font-semibold">Organization data</h2>
        </div>
        <div className="divide-border divide-y">
          {EXPORTS.map((item) => (
            <ExportRow key={item.label} item={item} />
          ))}
        </div>
      </div>

      {/* GDPR note */}
      <div className="rounded-card border-warning/30 bg-warning/5 border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-foreground text-sm font-medium">Data retention &amp; GDPR</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Exported files contain personal data. Handle them in accordance with your data
              protection obligations. To delete your account and erase your personal data, use the
              account deletion flow in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
