import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import { clients } from "@/db/schema";
import { ApiError, apiErrorResponse } from "@/server/api/helpers";
import { parseV1Pagination, requireV1Auth } from "@/server/api/v1";
import { withIdempotency } from "@/server/api/v1-with-idempotency";
import { createClientV1 } from "@/server/api/v1-mutations";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  company: z.string().max(255).nullish(),
  contactName: z.string().max(255).nullish(),
  contactEmail: z.string().email().nullish(),
  contactPhone: z.string().max(64).nullish(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  notes: z.string().nullish(),
});

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireV1Auth(request);
    const { limit, offset } = parseV1Pagination(request.nextUrl.searchParams);

    const rows = await db
      .select({
        id: clients.id,
        name: clients.name,
        company: clients.company,
        contactName: clients.contactName,
        contactEmail: clients.contactEmail,
        contactPhone: clients.contactPhone,
        status: clients.status,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .where(and(eq(clients.organizationId, organizationId), isNull(clients.deletedAt)))
      .orderBy(desc(clients.createdAt))
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
      const result = await createClientV1(organizationId, parsed.data);
      return { status: 201, body: result };
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
