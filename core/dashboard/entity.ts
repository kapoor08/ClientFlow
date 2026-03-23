export type DashboardTask = {
  id: string;
  title: string;
  projectName: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
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

export type DashboardContext = {
  userName: string | null;
  kpis: DashboardKPIs;
  tasksDueSoon: DashboardTask[];
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

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  todo: "bg-secondary text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  review: "bg-warning/10 text-warning",
  blocked: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};
