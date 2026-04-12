import { NextRequest, NextResponse } from "next/server";
import { getSsoContextForEmail } from "@/server/security/sso";

/**
 * GET /api/auth/sso/check?email=user@company.com
 *
 * Returns whether the given email's organization requires SSO login.
 * Used by the sign-in form to redirect SSO-enforced users before
 * they attempt password authentication.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ ssoRequired: false });
  }

  try {
    const ctx = await getSsoContextForEmail(email);
    return NextResponse.json({ ssoRequired: ctx !== null });
  } catch {
    // On error, allow password sign-in to proceed normally
    return NextResponse.json({ ssoRequired: false });
  }
}
