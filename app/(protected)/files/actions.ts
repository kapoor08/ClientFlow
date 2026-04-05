"use server";

import { getServerSession } from "@/lib/get-session";
import { listAllFilesForUser } from "@/lib/files";
import type { OrgFileListItem } from "@/core/files/entity";

export async function loadMoreFilesAction(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  order?: string;
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
}): Promise<OrgFileListItem[]> {
  const session = await getServerSession();
  if (!session) return [];

  const result = await listAllFilesForUser(session.user.id, {
    query: params.q,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    order: params.order === "asc" ? "asc" : "desc",
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    projectId: params.projectId || undefined,
  });

  return result.files.map((f) => ({
    ...f,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
  })) as OrgFileListItem[];
}
