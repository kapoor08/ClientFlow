import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { deleteTimeEntryForUser } from "@/lib/time-entries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    await deleteTimeEntryForUser(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
