import { NextRequest, NextResponse } from "next/server";
import { resendInvitationForUser, revokeInvitationForUser } from "@/lib/invitations";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/invitations/[id] — action-based: body { action: "revoke" | "resend" }
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "revoke") {
      await revokeInvitationForUser(userId, id);
      return NextResponse.json({ success: true });
    }

    if (action === "resend") {
      await resendInvitationForUser(userId, id);
      return NextResponse.json({ success: true });
    }

    throw new ApiError("Invalid action. Expected 'revoke' or 'resend'.", 422);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
