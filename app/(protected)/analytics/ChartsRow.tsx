import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckSquare,
  Clock,
  Receipt,
} from "lucide-react";
import { RevenueChart } from "./RevenueChart";
import { ChartCard, MonthlyChart, StatusDistribution } from "./ChartCard";
import type { AnalyticsSummary } from "@/core/analytics/entity";

export function ChartsRow({
  summary,
  totalProjects,
  totalInvoices,
  dateLabel,
}: {
  summary: AnalyticsSummary;
  totalProjects: number;
  totalInvoices: number;
  dateLabel: string;
}) {
  const totalTasks = summary.tasksByStatus.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="mb-8 space-y-6">
      {/* Row 1: Projects Created | Projects by Status | Revenue */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-muted-foreground" />
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
            <EmptyChart label="No project data for this period." />
          )}
        </ChartCard>

        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
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
              type="project"
            />
          ) : (
            <EmptyChart label="No projects for this period." />
          )}
        </ChartCard>

        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-muted-foreground" />
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
            <EmptyChart label="No revenue data for this period." />
          )}
        </ChartCard>
      </div>

      {/* Row 2: Tasks by Status | Hours Logged | Invoices by Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare size={16} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Tasks by Status
            </h2>
            {totalTasks > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {totalTasks} total
              </span>
            )}
          </div>
          {summary.tasksByStatus.length > 0 ? (
            <StatusDistribution
              data={summary.tasksByStatus}
              total={totalTasks}
              type="task"
            />
          ) : (
            <EmptyChart label="No task data for this period." />
          )}
        </ChartCard>

        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Hours Logged
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {dateLabel}
            </span>
          </div>
          {summary.monthlyHoursLogged.length > 0 ? (
            <MonthlyChart
              data={summary.monthlyHoursLogged}
              color="bg-cyan-500/80 hover:bg-cyan-500"
              unit="h"
            />
          ) : (
            <EmptyChart label="No time tracked for this period." />
          )}
        </ChartCard>

        <ChartCard>
          <div className="mb-4 flex items-center gap-2">
            <Receipt size={16} className="text-muted-foreground" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Invoices by Status
            </h2>
            {totalInvoices > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {totalInvoices} total
              </span>
            )}
          </div>
          {summary.invoicesByStatus.length > 0 ? (
            <StatusDistribution
              data={summary.invoicesByStatus}
              total={totalInvoices}
              type="invoice"
            />
          ) : (
            <EmptyChart label="No invoice data for this period." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
