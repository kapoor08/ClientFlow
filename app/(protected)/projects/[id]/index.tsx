import { useState } from "react";
import { mockProjects, mockTasks } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckSquare,
  Clock,
  Edit,
  Plus,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

const projStatus: Record<string, string> = {
  planning: "bg-neutral-300/50 text-neutral-700",
  active: "bg-info/10 text-info",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const taskStatus: Record<string, string> = {
  todo: "bg-neutral-300/50 text-neutral-700",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};

const tabs = [
  "Overview",
  "Tasks",
  "Files",
  "Team",
  "Activity",
  "Settings",
] as const;

const ProjectDetail = () => {
  const { projectId } = useParams();
  const project = mockProjects.find((p) => p.id === projectId);
  const projectTasks = mockTasks.filter((t) => t.projectId === projectId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  if (!project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/app/projects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {project.name}
              </h1>
              <span
                className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${projStatus[project.status]}`}
              >
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link
                href={`/app/clients/${project.clientId}`}
                className="text-primary hover:underline"
              >
                {project.clientName}
              </Link>
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Edit size={14} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {project.description}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
              <Calendar size={16} className="text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium text-foreground">
                {project.startDate} — {project.dueDate}
              </p>
            </div>
            <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
              <DollarSign size={16} className="text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium text-foreground">
                {project.budget}
              </p>
            </div>
            <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
              <Users size={16} className="text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Team</p>
              <p className="text-sm font-medium text-foreground">
                {project.teamCount} members
              </p>
            </div>
            <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
              <CheckSquare size={16} className="text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm font-medium text-foreground">
                {project.completedTasks}/{project.taskCount} completed
              </p>
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Overall Progress
            </p>
            <div className="h-2.5 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {project.progress}% complete
            </p>
          </div>
        </>
      )}

      {activeTab === "Tasks" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {projectTasks.length} tasks
            </p>
            <Button size="sm">
              <Plus size={14} className="mr-1" /> Add Task
            </Button>
          </div>
          {projectTasks.length === 0 ? (
            <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
              <p className="text-muted-foreground">
                No tasks in this project yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/app/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-card border border-border bg-card p-3 shadow-cf-1 hover:shadow-cf-2 transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
                      {task.assignee.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={10} /> {task.dueDate}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${taskStatus[task.status]}`}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Files" && (
        <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
          <p className="text-muted-foreground">
            File management for this project.
          </p>
          <Button className="mt-3" size="sm">
            Upload File
          </Button>
        </div>
      )}

      {activeTab === "Team" && (
        <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
          <p className="text-muted-foreground">
            {project.teamCount} team members assigned.
          </p>
          <Button className="mt-3" size="sm">
            Manage Team
          </Button>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
          <p className="text-muted-foreground">
            Project activity timeline will appear here.
          </p>
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="rounded-card border border-border bg-card p-8 text-center shadow-cf-1">
          <p className="text-muted-foreground">
            Project settings and configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
