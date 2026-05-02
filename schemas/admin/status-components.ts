import { z } from "zod";

/**
 * Discriminated union mirrors the `ProbeConfig` type in db/schemas/status.ts.
 * Validating server-side here means the form can submit only well-shaped
 * configs, even if a future UI bug constructs the wrong payload.
 */
const httpProbeSchema = z.object({
  kind: z.literal("http"),
  url: z.string().min(1, "Probe URL is required").max(500),
  method: z.enum(["GET", "POST"]),
  expectedStatus: z.number({ error: "Expected status is required" }).int().min(100).max(599),
  authHeader: z.string().max(80).optional().or(z.literal("")),
  authValueEnv: z.string().max(80).optional().or(z.literal("")),
  body: z.string().max(2000).optional().or(z.literal("")),
});

const stripeProbeSchema = z.object({
  kind: z.literal("stripe_balance"),
});

const signalProbeSchema = z.object({
  kind: z.literal("signal"),
  signalKey: z.string().min(1, "Signal key is required").max(80),
  staleAfterMin: z.number({ error: "Stale-after threshold is required" }).int().min(1).max(1440),
});

export const probeConfigSchema = z.discriminatedUnion("kind", [
  httpProbeSchema,
  stripeProbeSchema,
  signalProbeSchema,
]);

export const componentFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  probeConfig: probeConfigSchema,
  autoOpenIncidentAfterMin: z.number().int().min(1).max(1440).nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type ComponentFormValues = z.infer<typeof componentFormSchema>;
