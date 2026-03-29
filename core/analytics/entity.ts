export type ProjectStatusBreakdown = {
  status: string;
  total: number;
};

export type MonthlyCount = {
  month: string;
  total: number;
};

export type MonthlyRevenue = {
  month: string;
  totalCents: number;
};

export type RecentProject = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: string | null; // ISO string from API
  updatedAt: string;
};

export type AnalyticsSummary = {
  totalClients: number;
  activeProjects: number;
  completedProjects: number;
  totalFiles: number;
  totalRevenueCents: number;
  projectsByStatus: ProjectStatusBreakdown[];
  monthlyProjectCreation: MonthlyCount[];
  monthlyRevenue: MonthlyRevenue[];
  recentProjects: RecentProject[];
};

export type AnalyticsResponse = {
  summary: AnalyticsSummary;
};

export type DatePreset = "all" | "30d" | "90d" | "6m" | "1y";

export type AnalyticsFilters = {
  datePreset: DatePreset;
  clientId: string;
};

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
];

export function resolveDateRange(preset: DatePreset): {
  dateFrom?: string;
  dateTo?: string;
} {
  if (preset === "all") return {};
  const now = new Date();
  const from = new Date(now);
  if (preset === "30d") from.setDate(now.getDate() - 30);
  else if (preset === "90d") from.setDate(now.getDate() - 90);
  else if (preset === "6m") from.setMonth(now.getMonth() - 6);
  else if (preset === "1y") from.setFullYear(now.getFullYear() - 1);
  return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
}
