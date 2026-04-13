import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { revokeUserSession } from "@/server/admin/users";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sessionId } = await params;
  await revokeUserSession(sessionId);
  return NextResponse.json({ ok: true });
}
