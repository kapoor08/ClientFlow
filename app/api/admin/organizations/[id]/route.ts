import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { suspendOrganization, activateOrganization, deleteOrganization } from "@/lib/admin-data";

async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action } = await req.json() as { action: string };
  if (action === "suspend") await suspendOrganization(id);
  else if (action === "activate") await activateOrganization(id);
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guardAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteOrganization(id);
  return NextResponse.json({ ok: true });
}
