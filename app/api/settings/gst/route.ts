import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations } from "@/db/schema";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { isValidGstin, gstStateCodeFromGstin } from "@/lib/billing/india-gst";
import { writeAuditLog } from "@/server/security/audit";

/**
 * Updates the org-level India GST registration. Settings UI posts the GSTIN
 * (or null to clear) plus an optional legal-entity name. The state code is
 * derived from the GSTIN automatically; an explicit override is accepted but
 * must match if a GSTIN is also provided.
 */
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) {
    return NextResponse.json({ error: "No active organization" }, { status: 400 });
  }
  if (!ctx.canManageSettings) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    gstin?: string | null;
    gstStateCode?: string | null;
    gstLegalName?: string | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const rawGstin = typeof body.gstin === "string" ? body.gstin.trim().toUpperCase() : null;
  const gstin = rawGstin && rawGstin.length > 0 ? rawGstin : null;
  if (gstin && !isValidGstin(gstin)) {
    return NextResponse.json(
      { error: "GSTIN format is invalid. Expected 15 chars (e.g. 27AAACR5055K1Z5)." },
      { status: 422 },
    );
  }

  const derivedStateCode = gstin ? gstStateCodeFromGstin(gstin) : null;
  const explicitStateCode =
    typeof body.gstStateCode === "string" && body.gstStateCode.trim().length === 2
      ? body.gstStateCode.trim()
      : null;
  if (gstin && explicitStateCode && explicitStateCode !== derivedStateCode) {
    return NextResponse.json(
      {
        error: "Provided state code does not match the state code embedded in the GSTIN.",
      },
      { status: 422 },
    );
  }

  const legalName =
    typeof body.gstLegalName === "string" && body.gstLegalName.trim().length > 0
      ? body.gstLegalName.trim()
      : null;

  await db
    .update(organizations)
    .set({
      gstin,
      gstStateCode: derivedStateCode ?? explicitStateCode ?? null,
      gstLegalName: legalName,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, ctx.organizationId));

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: session.user.id,
    action: "organization.gst_updated",
    entityType: "organization",
    entityId: ctx.organizationId,
    metadata: { gstinSet: !!gstin },
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
