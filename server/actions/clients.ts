"use server";

import { getServerSession } from "@/server/auth/session";
import { listClientsForUser } from "@/server/clients";
import type { ClientListItem } from "@/server/clients";

export async function loadMoreClientsAction(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  order?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ClientListItem[]> {
  const session = await getServerSession();
  if (!session) return [];

  const result = await listClientsForUser(session.user.id, {
    query: params.q,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: params.status || undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
  });

  return result.clients;
}
