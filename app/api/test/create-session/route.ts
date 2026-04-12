import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session } from "@/db/auth-schema";
import { bootstrapWorkspaceForUser } from "@/server/organization-settings";

/**
 * POST /api/test/create-session
 *
 * Test-only endpoint: creates a verified user and a BetterAuth session directly
 * in the DB, bypassing email verification. Used exclusively by Playwright's
 * global setup to seed an authenticated session.
 *
 * Returns 404 in production. Never deploy without NODE_ENV=production.
 */

const SESSION_DAYS = 30;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { email, name } = (await request.json()) as { email: string; name?: string };

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userName = name ?? normalizedEmail.split("@")[0];

  // Find or create the test user
  let [existingUser] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (!existingUser) {
    const userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name: userName,
      email: normalizedEmail,
      emailVerified: true, // skip email verification for test user
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    existingUser = { id: userId, name: userName, email: normalizedEmail };

    await bootstrapWorkspaceForUser({
      id: userId,
      name: userName,
      email: normalizedEmail,
    });
  }

  // Create a BetterAuth session directly
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(session).values({
    id: crypto.randomUUID(),
    token: sessionToken,
    userId: existingUser.id,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: "Playwright/globalSetup",
  });

  const response = NextResponse.json({ ok: true, userId: existingUser.id });

  response.cookies.set("better-auth.session_token", sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
