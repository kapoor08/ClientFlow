import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import {
  upsertFlagOverride,
  deleteFlagOverride,
  listOverridesForFlag,
} from "@/server/admin/feature-flags";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/feature-flags";

function assertKey(key: string): FeatureFlagKey | null {
  return FEATURE_FLAG_KEYS.includes(key as FeatureFlagKey) ? (key as FeatureFlagKey) : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const flagKey = assertKey(key);
  if (!flagKey) return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });

  const data = await listOverridesForFlag(flagKey);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const flagKey = assertKey(key);
  if (!flagKey) return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as {
    organizationId?: string;
    enabled?: boolean;
  } | null;

  if (
    !body ||
    typeof body.enabled !== "boolean" ||
    typeof body.organizationId !== "string" ||
    body.organizationId.length === 0
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await upsertFlagOverride(flagKey, body.organizationId, body.enabled, admin.user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const flagKey = assertKey(key);
  if (!flagKey) return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
  }

  await deleteFlagOverride(flagKey, organizationId, admin.user.id);
  return NextResponse.json({ ok: true });
}
