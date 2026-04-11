import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/auth-schema";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { isIpAllowed, getClientIp } from "@/lib/ip-allowlist";

export async function GET(request: NextRequest) {
  // Try full session first (handles post-login and post-MFA cases)
  const session = await auth.api.getSession({ headers: request.headers });
  let userId = session?.user?.id ?? null;

  // After password verification but before TOTP, BetterAuth has no full session
  // cookie - only a pending 2FA state. Fall back to email-based lookup so we
  // can check the IP allowlist before the MFA screen is shown.
  if (!userId) {
    const email = request.nextUrl.searchParams.get("email");
    if (email) {
      const [found] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email.toLowerCase().trim()))
        .limit(1);
      userId = found?.id ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json({ blocked: false });
  }

  const orgCtx = await getOrganizationSettingsContextForUser(userId);

  if (!orgCtx?.ipAllowlist || orgCtx.ipAllowlist.length === 0) {
    return NextResponse.json({ blocked: false });
  }

  const clientIp = getClientIp(request.headers);
  const allowed = isIpAllowed(clientIp, orgCtx.ipAllowlist);

  return NextResponse.json({ blocked: !allowed });
}
