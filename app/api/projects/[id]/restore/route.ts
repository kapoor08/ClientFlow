import { NextRequest, NextResponse } from "next/server";
import { restoreProjectForUser } from "@/server/projects";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await restoreProjectForUser(userId, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
