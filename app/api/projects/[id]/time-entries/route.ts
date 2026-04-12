import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import { listTimeEntriesForProject, getProjectTimeSummary } from "@/server/time-entries";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const [entries, summary] = await Promise.all([
      listTimeEntriesForProject(userId, id),
      getProjectTimeSummary(userId, id),
    ]);

    return NextResponse.json({ entries: entries ?? [], summary });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
