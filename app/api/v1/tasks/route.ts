import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import { tasks } from "@/db/schema";
import { ApiError, apiErrorResponse } from "@/server/api/helpers";
import { parseV1Pagination, requireV1Auth } from "@/server/api/v1";
import { withIdempotency } from "@/server/api/v1-with-idempotency";
import { createTaskV1 } from "@/server/api/v1-mutations";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  projectId: z.string().min(1),
  description: z.string().nullish(),
  status: z.string().optional(),
  priority: z.string().nullish(),
  assigneeUserId: z.string().nullish(),
  dueDate: z.string().nullish(),
  estimateMinutes: z.number().int().nonnegative().nullish(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireV1Auth(request);
    const { limit, offset } = parseV1Pagination(request.nextUrl.searchParams);
    const projectId = request.nextUrl.searchParams.get("projectId");
    const status = request.nextUrl.searchParams.get("status");

    const rows = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeUserId: tasks.assigneeUserId,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        estimateMinutes: tasks.estimateMinutes,
        actualMinutes: tasks.actualMinutes,
        refNumber: tasks.refNumber,
        tags: tasks.tags,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, organizationId),
          isNull(tasks.deletedAt),
          projectId ? eq(tasks.projectId, projectId) : undefined,
          status ? eq(tasks.status, status) : undefined,
        ),
      )
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows, limit, offset });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireV1Auth(request);
    const rawBody = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new ApiError("Invalid JSON body.", 400);
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid request body.", 422);
    }

    return await withIdempotency(request, organizationId, rawBody, async () => {
      const result = await createTaskV1(organizationId, parsed.data);
      return { status: 201, body: result };
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
