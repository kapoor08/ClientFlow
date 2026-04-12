import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { getServerSession } from "@/server/auth/session";
import { listActivityForUser } from "@/server/activity";
import { activitySearchParamsCache } from "@/core/activity/searchParams";
import { ActivityFeed } from "@/components/activity-logs";

type ActivityLogsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const ActivityLogsPage = async ({ searchParams }: ActivityLogsPageProps) => {
  const session = await getServerSession();
  const { q, entityType, dateFrom, dateTo, page, pageSize } =
    activitySearchParamsCache.parse(await searchParams);

  const result = await listActivityForUser(session!.user.id, {
    query: q || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
  });

  if (!result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          You do not have permission to view activity logs.
        </p>
      </div>
    );
  }

  // Serialize Dates to ISO strings for client component
  const entries = result.entries.map((e) => ({
    ...e,
    createdAt:
      e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  }));

  return (
    <ListPageLayout
      title="Activity"
      description="Chronological activity across your organization"
    >
      <ActivityFeed entries={entries} pagination={result.pagination} />
    </ListPageLayout>
  );
};

export default ActivityLogsPage;
