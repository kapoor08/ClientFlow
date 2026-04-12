import { NextRequest, NextResponse } from "next/server";
import { listProjectsForUser, createProjectForUser } from "@/server/projects";
import { projectFormSchema } from "@/schemas/projects";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const query = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    );
    const sort = searchParams.get("sort") ?? "";
    const order =
      searchParams.get("order") === "asc" ? "asc" : ("desc" as const);
    const clientId = searchParams.get("clientId") ?? undefined;

    const result = await listProjectsForUser(userId, {
      query,
      page,
      pageSize,
      sort,
      order,
      clientId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.dueDate) body.dueDate = new Date(body.dueDate);
    const parsed = projectFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid request body.";
      throw new ApiError(firstError, 422);
    }

    const result = await createProjectForUser(userId, parsed.data);

    return NextResponse.json({ projectId: result.projectId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
