import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import {
  logTimeForUser,
  listTimeEntriesForTask,
  listTimeEntriesForProject,
  listTimeEntriesForOrg,
  type LogTimeInput,
} from "@/server/time-entries";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const sp = request.nextUrl.searchParams;
    const taskId = sp.get("taskId");
    const projectId = sp.get("projectId");
    const scope = sp.get("scope");

    // Org-wide listing for the /time-tracking page. Triggered explicitly with
    // ?scope=org so existing callers (task / project drawers) keep their
    // narrow behaviour.
    if (scope === "org") {
      const filterUserId = sp.get("userId") ?? undefined;
      const dateFrom = sp.get("dateFrom") ? new Date(sp.get("dateFrom")!) : undefined;
      const dateTo = sp.get("dateTo") ? new Date(sp.get("dateTo")!) : undefined;
      const page = Math.max(1, Number(sp.get("page")) || 1);
      const pageSize = Math.max(1, Number(sp.get("pageSize")) || 25);

      const result = await listTimeEntriesForOrg(userId, {
        projectId: projectId ?? undefined,
        userId: filterUserId,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });

      if (result === null) {
        return NextResponse.json({ error: "No active organization found." }, { status: 403 });
      }

      return NextResponse.json({
        entries: result.entries.map((e) => ({
          ...e,
          loggedAt: e.loggedAt.toISOString(),
          createdAt: e.createdAt.toISOString(),
        })),
        pagination: result.pagination,
        totalMinutes: result.totalMinutes,
      });
    }

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: "Either taskId, projectId, or scope=org is required." },
        { status: 400 },
      );
    }

    const entries = taskId
      ? await listTimeEntriesForTask(userId, taskId)
      : await listTimeEntriesForProject(userId, projectId!);

    if (entries === null) {
      return NextResponse.json({ error: "No active organization found." }, { status: 403 });
    }

    return NextResponse.json({
      entries: entries.map((e) => ({
        ...e,
        loggedAt: e.loggedAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await request.json()) as LogTimeInput;

    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }
    if (!body.minutes || body.minutes < 1) {
      return NextResponse.json({ error: "minutes must be at least 1." }, { status: 400 });
    }

    const result = await logTimeForUser(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
