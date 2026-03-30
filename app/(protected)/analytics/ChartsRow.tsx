import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { RevenueChart } from "./RevenueChart";
import {
  ChartCard,
  MonthlyChart,
  StatusDistribution,
} from "./ChartCard";
import {
  DATE_PRESET_OPTIONS,
  type AnalyticsSummary,
} from "@/core/analytics/entity";

export function ChartsRow({
  summary,
  totalProjects,
  datePreset,
}: {
  summary: AnalyticsSummary;
  totalProjects: number;
  datePreset: string;
}) {
  const dateLabel =
    DATE_PRESET_OPTIONS.find((o) => o.value === datePreset)?.label ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Monthly Projects Chart */}
      <ChartCard>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Projects Created
          </h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {dateLabel}
          </span>
        </div>
        {summary.monthlyProjectCreation.length > 0 ? (
          <MonthlyChart data={summary.monthlyProjectCreation} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No project data for this period.
          </div>
        )}
      </ChartCard>

      {/* Project Status Distribution */}
      <ChartCard>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Projects by Status
          </h2>
          {totalProjects > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {totalProjects} total
            </span>
          )}
        </div>
        {summary.projectsByStatus.length > 0 ? (
          <StatusDistribution
            data={summary.projectsByStatus}
            total={totalProjects}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No projects for this period.
          </div>
        )}
      </ChartCard>

      {/* Monthly Revenue Chart */}
      <ChartCard>
        <div className="mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-muted-foreground" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Revenue
          </h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {dateLabel}
          </span>
        </div>
        {summary.monthlyRevenue.length > 0 ? (
          <RevenueChart data={summary.monthlyRevenue} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No revenue data for this period.
          </div>
        )}
      </ChartCard>
    </div>
  );
}
