import { PROJECT_STATUS_LABELS as BASE_PROJECT_STATUS_LABELS } from "@/helpers/project";
import { TASK_STATUS_LABELS } from "@/helpers/task";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ...BASE_PROJECT_STATUS_LABELS,
  active: "Active",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-400",
  active: "bg-emerald-500",
  in_progress: "bg-primary",
  on_hold: "bg-amber-400",
  completed: "bg-green-600",
  cancelled: "bg-muted-foreground",
};

const ANALYTICS_TASK_STATUS_LABELS: Record<string, string> = {
  ...TASK_STATUS_LABELS,
  cancelled: "Cancelled",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-primary",
  done: "bg-emerald-500",
  cancelled: "bg-muted-foreground",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-400",
  sent: "bg-blue-400",
  paid: "bg-emerald-500",
  overdue: "bg-red-500",
};

export {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_COLORS,
  ANALYTICS_TASK_STATUS_LABELS as TASK_STATUS_LABELS,
};
