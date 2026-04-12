import { NextResponse } from "next/server";
import { revokeAllOtherSessionsForCurrentUser } from "@/server/security/data";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";

export async function POST() {
  try {
    await requireAuth();
    const count = await revokeAllOtherSessionsForCurrentUser();
    return NextResponse.json({ revoked: count });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
