"use client";

import {
  Users,
  FolderKanban,
  CheckSquare,
  Receipt,
  UserCog,
  Database,
  AlertTriangle,
} from "lucide-react";
import { ExportRow, type ExportItem } from "@/components/settings/data/ExportRow";
import { PersonalDataSection } from "@/components/settings/data/PersonalDataSection";

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
