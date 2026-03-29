import { NextRequest, NextResponse } from "next/server";
import { listApiKeysForUser, createApiKeyForUser } from "@/lib/api-keys";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const keys = await listApiKeysForUser(userId);
    if (!keys) throw new ApiError("No active organization found.", 403);
    return NextResponse.json({
      keys: keys.map((k) => ({
        ...k,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        expiresAt: k.expiresAt?.toISOString() ?? null,
        revokedAt: k.revokedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const name = body?.name as string | undefined;
    const expiresInDays = body?.expiresInDays as number | undefined;

    if (!name) throw new ApiError("Key name is required.", 422);

    const result = await createApiKeyForUser(userId, name, expiresInDays);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
