import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/admin-guard";
import { suspendOrganization, restoreOrganization, deleteOrganization } from "@/server/admin/organizations";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, forbidden } = await requireAdmin();
  if (forbidden) return forbidden;
  const { id } = await params;
  const { action, reason } = await req.json() as { action: string; reason?: string };
  if (action === "suspend") {
    await suspendOrganization(id, reason ?? "", session.user.id);
  } else if (action === "restore") {
    await restoreOrganization(id, session.user.id);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, forbidden } = await requireAdmin();
  if (forbidden) return forbidden;
  const { id } = await params;
  await deleteOrganization(id, session.user.id);
  return NextResponse.json({ ok: true });
}
