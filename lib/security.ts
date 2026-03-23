import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";
import { session as sessionTable } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/get-session";

export type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
};

export async function listSessionsForCurrentUser(): Promise<{
  sessions: SessionItem[];
  currentSessionToken: string | null;
} | null> {
  const serverSession = await getServerSession();
  if (!serverSession?.user) return null;

  const userId = serverSession.user.id;
  const currentToken = serverSession.session?.token ?? null;

  const rows = await db
    .select({
      id: sessionTable.id,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
      createdAt: sessionTable.createdAt,
      updatedAt: sessionTable.updatedAt,
      expiresAt: sessionTable.expiresAt,
      token: sessionTable.token,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, userId))
    .orderBy(desc(sessionTable.updatedAt));

  return {
    sessions: rows.map((r) => ({
      id: r.id,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      expiresAt: r.expiresAt,
      isCurrent: r.token === currentToken,
    })),
    currentSessionToken: currentToken,
  };
}

export async function revokeSessionForCurrentUser(
  sessionId: string,
): Promise<void> {
  const serverSession = await getServerSession();
  if (!serverSession?.user) throw new Error("Not authenticated.");

  const userId = serverSession.user.id;
  const currentToken = serverSession.session?.token;

  // Verify the session belongs to this user
  const existing = await db
    .select({ id: sessionTable.id, token: sessionTable.token })
    .from(sessionTable)
    .where(
      and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, userId)),
    )
    .limit(1);

  if (!existing[0]) throw new Error("Session not found.");
  if (existing[0].token === currentToken) {
    throw new Error("Cannot revoke your current session.");
  }

  await db
    .delete(sessionTable)
    .where(eq(sessionTable.id, sessionId));
}

export async function revokeAllOtherSessionsForCurrentUser(): Promise<number> {
  const serverSession = await getServerSession();
  if (!serverSession?.user) throw new Error("Not authenticated.");

  const userId = serverSession.user.id;
  const currentToken = serverSession.session?.token;

  if (!currentToken) throw new Error("No current session token.");

  const result = await db
    .delete(sessionTable)
    .where(
      and(
        eq(sessionTable.userId, userId),
        ne(sessionTable.token, currentToken),
      ),
    )
    .returning({ id: sessionTable.id });

  return result.length;
}
