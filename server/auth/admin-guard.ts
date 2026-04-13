import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";

/**
 * Verifies the caller is a platform admin.
 * Returns the session on success, or null on failure.
 */
export async function guardAdmin() {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin === true ? session : null;
}

/** Shorthand for API route handlers: returns a 403 response if not admin. */
export async function requireAdmin(): Promise<
  { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; forbidden?: never } |
  { forbidden: NextResponse; session?: never }
> {
  const session = await guardAdmin();
  if (!session) {
    return { forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
