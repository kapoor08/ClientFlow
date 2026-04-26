import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { searchOrganizationsForPicker } from "@/server/admin/feature-flags";

/**
 * Lightweight org-picker search for admin UIs (e.g. feature-flag overrides).
 * Capped at 20 results, requires at least 2 chars to avoid full-table scans.
 */
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const data = await searchOrganizationsForPicker(q);
  return NextResponse.json({ data });
}
