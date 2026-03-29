import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { organizationMemberships, organizations } from "@/db/schema";
import { setActiveOrgCookie } from "@/lib/active-org";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const organizationId: string = body.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required." }, { status: 400 });
    }

    // Verify the user is actually an active member of the target org
    const [membership] = await db
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.status, "active"),
          eq(organizations.isActive, true),
        ),
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization." }, { status: 403 });
    }

    await setActiveOrgCookie(organizationId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
