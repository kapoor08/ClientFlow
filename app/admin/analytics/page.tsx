import { adminAnalyticsSearchParamsCache } from "@/schemas/admin/analytics";
import {
  getAdminAnalyticsData,
  getPlatformStats,
  getMrrTrend,
  getGrowthTrend,
  getPlanDistribution,
} from "@/server/admin/analytics";
import AdminAnalyticsPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { period } = adminAnalyticsSearchParamsCache.parse(await searchParams);
  const days = Math.max(7, Math.min(90, parseInt(period) || 30));

  const [data, stats, mrrTrend, growthTrend, planDistribution] = await Promise.all([
    getAdminAnalyticsData(),
    getPlatformStats(days),
    getMrrTrend(12),
    getGrowthTrend(6),
    getPlanDistribution(),
  ]);

  return (
    <AdminAnalyticsPage
      data={data}
      stats={stats}
      mrrTrend={mrrTrend}
      growthTrend={growthTrend}
      planDistribution={planDistribution}
      period={period}
      days={days}
    />
  );
}
