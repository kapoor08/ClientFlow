import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { deleteUser } from "@/lib/admin-data";

async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true ? session : null;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === admin.user.id) return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
