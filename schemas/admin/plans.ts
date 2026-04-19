import { z } from "zod";

export const planFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  description: z.string().max(500).optional(),
  currencyCode: z.string().length(3).optional(),
  monthlyPriceCents: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .transform((v) => (v === undefined || isNaN(v) ? undefined : v)),
  yearlyPriceCents: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .transform((v) => (v === undefined || isNaN(v) ? undefined : v)),
  trialDays: z.coerce.number().int().min(0).max(365).optional(),
  maxSeats: z.coerce.number().int().min(1).optional(),
  maxProjects: z.coerce.number().int().min(1).optional(),
  maxClients: z.coerce.number().int().min(1).optional(),
  monthlyApiCallsLimit: z.coerce.number().int().min(0).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  recommendedBadge: z.enum(["popular", "enterprise", "", "none"]).optional(),
  features: z.array(z.string().min(1).max(200)).max(20).optional(),
});
export type PlanFormValues = z.infer<typeof planFormSchema>;

export const createPlanSchema = planFormSchema.extend({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters.")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase letters, numbers, or underscores."),
});
export type CreatePlanValues = z.infer<typeof createPlanSchema>;

export const clonePlanSchema = z.object({
  sourcePlanId: z.string().min(1),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase letters, numbers, or underscores."),
  name: z.string().min(1, "Name is required.").max(100),
});
export type ClonePlanValues = z.infer<typeof clonePlanSchema>;
