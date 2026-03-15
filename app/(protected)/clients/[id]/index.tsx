import { mockClients, mockProjects } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-neutral-300/50 text-neutral-700",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const projStatus: Record<string, string> = {
  planning: "bg-neutral-300/50 text-neutral-700",
  active: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const ClientDetail = () => {
  const { clientId } = useParams();
  const client = mockClients.find((c) => c.id === clientId);
  const clientProjects = mockProjects.filter((p) => p.clientId === clientId);

  if (!client) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/app/clients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-primary">
              {client.avatarInitials}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {client.name}
              </h1>
              <p className="text-sm text-muted-foreground">{client.company}</p>
            </div>
            <span
              className={`ml-2 rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
            >
              {client.status}
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Edit size={14} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={14} /> Email
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {client.email}
          </p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone size={14} /> Phone
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {client.phone}
          </p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} /> Client Since
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {client.createdAt}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1 text-center">
          <FolderKanban size={20} className="mx-auto text-primary" />
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {client.projectCount}
          </div>
          <p className="text-xs text-muted-foreground">Projects</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1 text-center">
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {client.totalRevenue}
          </div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5 shadow-cf-1 text-center">
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {client.lastActivity}
          </div>
          <p className="text-xs text-muted-foreground">Last Activity</p>
        </div>
      </div>

      {/* Linked Projects */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Linked Projects
      </h2>
      {clientProjects.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
          <p className="text-muted-foreground">
            No projects linked to this client yet.
          </p>
          <Button className="mt-3" size="sm" asChild>
            <Link href="/app/projects/new">Create Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clientProjects.map((proj) => (
            <Link
              key={proj.id}
              href={`/app/projects/${proj.id}`}
              className="group rounded-card border border-border bg-card p-4 shadow-cf-1 transition-shadow hover:shadow-cf-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground group-hover:text-primary">
                  {proj.name}
                </h3>
                <span
                  className={`rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${projStatus[proj.status]}`}
                >
                  {proj.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {proj.completedTasks}/{proj.taskCount} tasks
                </span>
                <span>Due {proj.dueDate}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDetail;