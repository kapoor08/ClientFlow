import { z } from "zod";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export const INVITATION_STATUS_OPTIONS: {
  value: InvitationStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

// Role hierarchy - lower number = higher authority
export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 0,
  admin: 1,
  manager: 2,
  member: 3,
  client: 4,
};

// Returns role keys that the given role is allowed to assign
export function getAssignableRoleKeys(myRoleKey: string): string[] {
  const myLevel = ROLE_HIERARCHY[myRoleKey] ?? 999;
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level > myLevel)
    .map(([key]) => key);
}

export const INVITE_EXPIRY_DAYS = 7;

export const inviteFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  roleId: z.string().min(1, "Select a role."),
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function getDefaultInviteFormValues(): InviteFormValues {
  return { email: "", roleId: "" };
}
