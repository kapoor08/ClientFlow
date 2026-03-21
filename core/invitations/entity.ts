import type { InvitationStatus, InviteFormValues } from "@/lib/invitations-shared";

export type InvitationListItem = {
  id: string;
  email: string;
  roleKey: string;
  roleName: string;
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: string; // ISO string from JSON
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type InvitationListResponse = {
  invitations: InvitationListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type AssignableRole = {
  id: string;
  key: string;
  name: string;
};

export type AssignableRolesResponse = {
  roles: AssignableRole[];
};

export type SendInviteData = InviteFormValues;

export type InviteMutationResponse = {
  invitationId: string;
};

export type InviteActionResponse = {
  success: boolean;
};
