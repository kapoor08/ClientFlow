import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { revokeAllUserSessions } from "@/server/admin";

async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true ? session : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await revokeAllUserSessions(id);
  return NextResponse.json({ ok: true });
}
