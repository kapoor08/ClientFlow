import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { logTimeForUser, type LogTimeInput } from "@/lib/time-entries";

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
