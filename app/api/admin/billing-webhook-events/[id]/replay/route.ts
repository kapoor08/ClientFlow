import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { replayBillingWebhookEvent } from "@/server/admin/billing-webhook-events";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const result = await replayBillingWebhookEvent(id, admin.user.id);
  if (!result.replayed) {
    return NextResponse.json(
      { error: result.reason ?? "replay_failed" },
      {
        status:
          result.reason === "not_found" ? 404 : result.reason === "already_processed" ? 409 : 500,
      },
    );
  }
  return NextResponse.json({ ok: true });
}
