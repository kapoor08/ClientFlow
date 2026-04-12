import { NextRequest, NextResponse } from "next/server";
import { revokeApiKeyForUser, deleteApiKeyForUser } from "@/server/api-keys";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type Params = { params: Promise<{ keyId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { keyId } = await params;
    const body = await request.json();
    const action = body?.action as string | undefined;
    if (action !== "revoke") throw new ApiError("Invalid action.", 422);
    await revokeApiKeyForUser(userId, keyId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { keyId } = await params;
    await deleteApiKeyForUser(userId, keyId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
