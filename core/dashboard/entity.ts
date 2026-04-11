export type DashboardTask = {
  id: string;
  title: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
};

export type DashboardProject = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: string | null;
  clientName: string | null;
};

export type DashboardActivity = {
  id: string;
  action: string;
  entityType: string;
  actorName: string | null;
  createdAt: string;
};

export type DashboardKPIs = {
  activeClients: number;
  newClientsThisMonth: number;
  projectsInProgress: number;
  projectsDueThisWeek: number;
  openTasks: number;
  overdueTasks: number;
  monthlyRevenueCents: number;
};

export type RevenueTrendPoint = {
  month: string;
  revenueCents: number;
};

export type DashboardContext = {
  userName: string | null;
  kpis: DashboardKPIs;
  revenueTrend: RevenueTrendPoint[];
  tasksDueSoon: DashboardTask[];
  recentProjects: DashboardProject[];
  recentActivity: DashboardActivity[];
};

// ─── Formatting helpers ────────────────────────────────────────────────────────

export function formatRevenue(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${dollars.toFixed(0)}`;
}

export type DueLabel = { label: string; isOverdue: boolean };

export function formatDueDate(iso: string | null): DueLabel {
  if (!iso) return { label: "No date", isOverdue: false };
  const d = new Date(iso);
  const now = new Date();
  // Compare calendar days (ignore time)
  const diffMs = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: "Overdue", isOverdue: true };
  if (days === 0) return { label: "Today", isOverdue: false };
  if (days === 1) return { label: "Tomorrow", isOverdue: false };
  return {
    label: new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    isOverdue: false,
  };
}

const ACTIVITY_LABELS: Record<string, string> = {
  "client.created": "created a client",
  "client.updated": "updated a client",
  "client.deleted": "deleted a client",
  "project.created": "created a project",
  "project.updated": "updated a project",
  "project.deleted": "deleted a project",
  "task.created": "created a task",
  "task.updated": "updated a task",
  "task.deleted": "deleted a task",
  "column.moved": "moved a task",
  "file.uploaded": "uploaded a file",
  "file.deleted": "deleted a file",
  "invitation.sent": "sent an invitation",
  "comment.added": "added a comment",
};

export function formatActivity(action: string): string {
  return ACTIVITY_LABELS[action] ?? action.replace(".", " ");
}

