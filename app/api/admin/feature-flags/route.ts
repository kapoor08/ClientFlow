import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { upsertFeatureFlag } from "@/server/admin/feature-flags";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/feature-flags";

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    key?: string;
    enabled?: boolean;
    description?: string | null;
  } | null;

  if (!body || typeof body.enabled !== "boolean" || typeof body.key !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!FEATURE_FLAG_KEYS.includes(body.key as FeatureFlagKey)) {
    return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });
  }

  await upsertFeatureFlag(
    body.key as FeatureFlagKey,
    {
      enabled: body.enabled,
      description: body.description ?? null,
    },
    admin.user.id,
  );

  return NextResponse.json({ ok: true });
}
