"use client";

import { m as Motion } from "framer-motion";
import { FileText } from "lucide-react";
import { PageHeader, SearchFiltersBar, ActionIcons, Pagination } from "../shared";

const FILES = [
  {
    name: "EMAIL_TEMPLATE_INVENTORY.md",
    icon: FileText,
    project: "Prop Firm Genie",
    client: "Kevin Tu",
    size: "21.4 KB",
    uploaded: "Mar 23, 2026",
  },
  {
    name: "README.md",
    icon: FileText,
    project: "Prop Firm Genie",
    client: "Kevin Tu",
    size: "8.5 KB",
    uploaded: "Mar 21, 2026",
  },
];

const row = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: i * 0.04, duration: 0.2 } }),
};

export function HeroFilesPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <PageHeader title="Files" description="2 files across all projects" />
      <SearchFiltersBar placeholder="Search files..." showDates showFilters showViewToggle />

      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-secondary/50 border-b">
              {["", "File", "Project", "Client", "Size", "Uploaded"].map((h, i) => (
                <th
                  key={i}
                  className="text-muted-foreground px-4 py-2.5 text-left text-[10px] font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FILES.map((f, i) => (
              <Motion.tr
                key={f.name}
                custom={i}
                variants={row}
                initial="hidden"
                animate="show"
                className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
              >
                <td className="px-4 py-2.5">
                  <ActionIcons />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-secondary flex h-5 w-5 items-center justify-center rounded">
                      <f.icon size={10} className="text-muted-foreground" />
                    </div>
                    <span className="text-foreground text-[11px] font-medium">{f.name}</span>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{f.project}</td>
                <td className="text-muted-foreground px-4 py-2.5 text-[11px]">{f.client}</td>
                <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{f.size}</td>
                <td className="text-muted-foreground px-4 py-2.5 text-[10px]">{f.uploaded}</td>
              </Motion.tr>
            ))}
          </tbody>
        </table>
        <Pagination showing="2 results" pageSize="20 / page" />
      </div>
    </div>
  );
}
