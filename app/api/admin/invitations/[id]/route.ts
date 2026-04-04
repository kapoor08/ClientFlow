import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { revokeInvitation } from "@/lib/admin-data";

async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await revokeInvitation(id);
  return NextResponse.json({ ok: true });
}
