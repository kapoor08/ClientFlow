import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import { projects } from "@/db/schema";
import { ApiError, apiErrorResponse } from "@/server/api/helpers";
import { parseV1Pagination, requireV1Auth } from "@/server/api/v1";
import { withIdempotency } from "@/server/api/v1-with-idempotency";
import { createProjectV1 } from "@/server/api/v1-mutations";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  clientId: z.string().min(1),
  description: z.string().nullish(),
  status: z.string().optional(),
  priority: z.string().nullish(),
  startDate: z.string().nullish(),
  dueDate: z.string().nullish(),
  budgetType: z.string().nullish(),
  budgetCents: z.number().int().nonnegative().nullish(),
});

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireV1Auth(request);
    const { limit, offset } = parseV1Pagination(request.nextUrl.searchParams);

    const rows = await db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        completedAt: projects.completedAt,
        budgetType: projects.budgetType,
        budgetCents: projects.budgetCents,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(and(eq(projects.organizationId, organizationId), isNull(projects.deletedAt)))
      .orderBy(desc(projects.createdAt))
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
      const result = await createProjectV1(organizationId, parsed.data);
      return { status: 201, body: result };
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
