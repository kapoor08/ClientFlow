import { http } from "@/core/infrastructure";
import type { SessionsResponse } from "./entity";

export async function listSessions(): Promise<SessionsResponse> {
  return http<SessionsResponse>("/api/security/sessions");
}

export async function revokeSession(sessionId: string): Promise<void> {
  return http<void>(`/api/security/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function revokeAllSessions(): Promise<{ revoked: number }> {
  return http<{ revoked: number }>("/api/security/sessions/revoke-all", {
    method: "POST",
  });
}
