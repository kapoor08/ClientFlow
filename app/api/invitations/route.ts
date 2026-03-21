import { NextRequest, NextResponse } from "next/server";
import { listInvitationsForOrg, sendInvitationForUser } from "@/lib/invitations";
import { inviteFormSchema } from "@/lib/invitations-shared";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE);

    const result = await listInvitationsForOrg(userId, { page, pageSize });
    if (!result.access) throw new ApiError("No active organization found.", 403);

    return NextResponse.json({
      invitations: result.invitations,
      pagination: result.pagination,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const parsed = inviteFormSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ApiError(firstError, 422);
    }

    const result = await sendInvitationForUser(userId, parsed.data);
    return NextResponse.json({ invitationId: result.invitationId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
