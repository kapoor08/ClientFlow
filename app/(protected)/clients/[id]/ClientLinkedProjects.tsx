import Link from "next/link";
import { FolderKanban } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ClientLinkedProject } from "@/lib/clients";
import { formatDate } from "@/utils/date";

const projectStatusBadge: Record<string, string> = {
  planning: "bg-neutral-300/50 text-neutral-700",
  active: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  archived: "bg-neutral-300/50 text-neutral-500",
};

export function ClientLinkedProjects({
  linkedProjects,
}: {
  linkedProjects: ClientLinkedProject[];
}) {
  if (linkedProjects.length === 0) {
    return (
      <Empty className="rounded-card border border-border bg-card py-14 shadow-cf-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanban />
          </EmptyMedia>
          <EmptyTitle>No linked projects yet.</EmptyTitle>
          <EmptyDescription>
            Projects associated with this client will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {linkedProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group rounded-card border border-border bg-card p-4 shadow-cf-1 transition-shadow hover:shadow-cf-2"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium text-foreground group-hover:text-primary">
              {project.name}
            </h3>
            <span
              className={`rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${projectStatusBadge[project.status] ?? "bg-neutral-300/50 text-neutral-700"}`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated {formatDate(project.updatedAt)}</span>
            <span>Due {formatDate(project.dueDate)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
