import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockProjects } from "@/data/mockData";
import { Search, Plus, ArrowUpDown, MoreHorizontal } from "lucide-react";

const projStatus: Record<string, string> = {
  planning: "bg-neutral-300/50 text-neutral-700",
  active: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const priorityBadge: Record<string, string> = {
  low: "bg-neutral-300/50 text-neutral-700",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

const ProjectsPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockProjects.length} projects total
          </p>
        </div>
        <Button asChild>
          <Link href="/app/projects/new">
            <Plus size={16} className="mr-1.5" /> New Project
          </Link>
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button className="flex items-center gap-1">
                  <span>Project</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Client
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Priority
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Progress
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Due Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((proj) => (
              <tr
                key={proj.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/app/projects/${proj.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {proj.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground md:hidden">
                    {proj.clientName}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {proj.clientName}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${projStatus[proj.status]}`}
                  >
                    {proj.status.replace("_", " ")}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${priorityBadge[proj.priority]}`}
                  >
                    {proj.priority}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {proj.progress}%
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                  {proj.dueDate}
                </td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsPage;
