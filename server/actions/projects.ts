"use server";

import { getServerSession } from "@/server/auth/session";
import { listProjectsForUser } from "@/server/projects";
import type { ProjectListItem } from "@/server/projects";

export async function loadMoreProjectsAction(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  order?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ProjectListItem[]> {
  const session = await getServerSession();
  if (!session) return [];

  const result = await listProjectsForUser(session.user.id, {
    query: params.q,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: params.status || undefined,
    priority: params.priority || undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
  });

  return result.projects;
}
