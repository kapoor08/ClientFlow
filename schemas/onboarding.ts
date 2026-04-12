import { z } from "zod";

// ─── Constants ───────────────────────────────────────────────────────────────

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
] as const;

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "CHF", label: "CHF - Swiss Franc" },
] as const;

export const INVITE_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
] as const;

// ─── Step 1: Organization profile ────────────────────────────────────────────

const timezoneValues = TIMEZONE_OPTIONS as readonly string[] as [
  string,
  ...string[],
];
const currencyValues = CURRENCY_OPTIONS.map((c) => c.value) as [
  string,
  ...string[],
];

export const organizationProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required.")
    .max(120, "Name must be 120 characters or fewer."),
  slug: z
    .string()
    .min(2, "URL slug must be at least 2 characters.")
    .max(48, "URL slug must be 48 characters or fewer.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),
  timezone: z.enum(timezoneValues, {
    message: "Please select a timezone.",
  }),
  currencyCode: z.enum(currencyValues, {
    message: "Please select a currency.",
  }),
});

export type OrganizationProfileFormValues = z.infer<
  typeof organizationProfileSchema
>;

export function getDefaultOrganizationProfileValues(
  overrides?: Partial<OrganizationProfileFormValues>,
): OrganizationProfileFormValues {
  return {
    name: "",
    slug: "",
    timezone: "UTC",
    currencyCode: "USD",
    ...overrides,
  };
}

// ─── Step 2: Workspace invites ───────────────────────────────────────────────

const inviteRoleValues = INVITE_ROLE_OPTIONS.map((r) => r.value) as [
  string,
  ...string[],
];

export const workspaceInviteSchema = z.object({
  email: z.union(
    [z.literal(""), z.string().email("Enter a valid email address.")],
    { message: "Enter a valid email address." },
  ),
  role: z.enum(inviteRoleValues),
});

export const workspaceInvitesSchema = z.object({
  invites: z
    .array(workspaceInviteSchema)
    .min(1, "At least one invite row is required.")
    .max(5, "You can invite up to 5 teammates at a time."),
});

export type WorkspaceInvite = z.infer<typeof workspaceInviteSchema>;
export type WorkspaceInvitesFormValues = z.infer<
  typeof workspaceInvitesSchema
>;

export function getDefaultWorkspaceInvitesValues(): WorkspaceInvitesFormValues {
  return {
    invites: [{ email: "", role: "member" }],
  };
}

// ─── Slug helper (shared client + server) ────────────────────────────────────

export function slugifyOrganizationName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
