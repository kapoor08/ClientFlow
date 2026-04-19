import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { deleteUser } from "@/server/admin/users";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === admin.user.id) return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  await deleteUser(id, admin.user.id);
  return NextResponse.json({ ok: true });
}
