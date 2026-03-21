import { http } from "@/core/infrastructure";
import type {
  InvitationListResponse,
  AssignableRolesResponse,
  SendInviteData,
  InviteMutationResponse,
  InviteActionResponse,
} from "./entity";

export async function listInvitations(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<InvitationListResponse> {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return http<InvitationListResponse>(`/api/invitations${qs ? `?${qs}` : ""}`);
}

export async function getAssignableRoles(): Promise<AssignableRolesResponse> {
  return http<AssignableRolesResponse>("/api/invitations/roles");
}

export async function sendInvitation(
  data: SendInviteData,
): Promise<InviteMutationResponse> {
  return http<InviteMutationResponse>("/api/invitations", {
    method: "POST",
    body: data,
  });
}

export async function revokeInvitation(
  invitationId: string,
): Promise<InviteActionResponse> {
  return http<InviteActionResponse>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: { action: "revoke" },
  });
}

export async function resendInvitation(
  invitationId: string,
): Promise<InviteActionResponse> {
  return http<InviteActionResponse>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: { action: "resend" },
  });
}
