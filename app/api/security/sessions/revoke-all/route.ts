import { NextResponse } from "next/server";
import { revokeAllOtherSessionsForCurrentUser } from "@/lib/security";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

export async function POST() {
  try {
    await requireAuth();
    const count = await revokeAllOtherSessionsForCurrentUser();
    return NextResponse.json({ revoked: count });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
