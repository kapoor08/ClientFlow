import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const;

export type ClientStatus = (typeof CLIENT_STATUS_OPTIONS)[number]["value"];

const clientStatusValues = CLIENT_STATUS_OPTIONS.map((o) => o.value) as [
  ClientStatus,
  ...ClientStatus[],
];

export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, "Client name is required.")
    .max(255, "Name must be 255 characters or fewer."),
  company: z
    .string()
    .min(1, "Company name is required.")
    .max(255, "Company name must be 255 characters or fewer."),
  contactName: z
    .string()
    .min(1, "Contact name is required.")
    .max(255, "Contact name must be 255 characters or fewer."),
  contactEmail: z.union([
    z.string().email("Enter a valid contact email address."),
    z.literal(""),
  ]),
  contactPhone: z
    .string()
    .refine(
      (val) => val === "" || (val !== "_invalid_" && isValidPhoneNumber(val)),
      "Enter a valid phone number.",
    ),
  status: z.enum(clientStatusValues, {
    error: "Select a valid client status.",
  }),
  notes: z.string().max(5000, "Notes must be 5,000 characters or fewer."),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export function getDefaultClientFormValues(): ClientFormValues {
  return {
    name: "",
    company: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "active",
    notes: "",
  };
}
