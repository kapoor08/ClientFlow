import { http } from "@/core/infrastructure";
import type { TeamListResponse } from "./entity";

export async function listTeamMembers(): Promise<TeamListResponse> {
  return http<TeamListResponse>("/api/team");
}

export async function updateMemberRole(
  membershipId: string,
  roleKey: string,
): Promise<void> {
  return http<void>(`/api/team/${membershipId}`, {
    method: "PATCH",
    body: { action: "change-role", roleKey },
  });
}

export async function suspendMember(membershipId: string): Promise<void> {
  return http<void>(`/api/team/${membershipId}`, {
    method: "PATCH",
    body: { action: "suspend" },
  });
}

export async function reactivateMember(membershipId: string): Promise<void> {
  return http<void>(`/api/team/${membershipId}`, {
    method: "PATCH",
    body: { action: "reactivate" },
  });
}

export async function removeMember(membershipId: string): Promise<void> {
  return http<void>(`/api/team/${membershipId}`, { method: "DELETE" });
}
