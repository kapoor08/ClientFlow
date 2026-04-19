import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import {
  logTimeForUser,
  listTimeEntriesForTask,
  listTimeEntriesForProject,
  type LogTimeInput,
} from "@/server/time-entries";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const taskId = request.nextUrl.searchParams.get("taskId");
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: "Either taskId or projectId is required." },
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
