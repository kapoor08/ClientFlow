import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/admin-guard";
import { getAdminAnalyticsData } from "@/server/admin/analytics";

export async function GET() {
  const { forbidden } = await requireAdmin();
  if (forbidden) return forbidden;

  const { dailyMetrics, topOrgs } = await getAdminAnalyticsData();

  const activityRows = [
    ["Date", "Tasks Created", "Tasks Completed", "Active Users"],
    ...dailyMetrics.map((r) => [
      r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      Number(r.tasksCreated ?? 0),
      Number(r.tasksCompleted ?? 0),
      Number(r.activeUsers ?? 0),
    ]),
  ];

  const orgRows = [
    [],
    ["Top Organizations (by tasks created)", "", "", ""],
    ["Organization", "Total Tasks Created", "Total Active Users", "Created"],
    ...topOrgs.map((o) => [
      o.name,
      Number(o.totalTasksCreated ?? 0),
      Number(o.totalActiveUsers ?? 0),
      new Date(o.createdAt).toISOString().slice(0, 10),
    ]),
  ];

  const csv = [...activityRows, ...orgRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
