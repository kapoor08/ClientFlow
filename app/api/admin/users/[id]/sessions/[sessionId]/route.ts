import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { revokeUserSession } from "@/lib/admin-data";

async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true ? session : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sessionId } = await params;
  await revokeUserSession(sessionId);
  return NextResponse.json({ ok: true });
}
