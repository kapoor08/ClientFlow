import { z } from "zod";

export const INCIDENT_STATES = ["investigating", "identified", "monitoring", "resolved"] as const;

export const INCIDENT_IMPACTS = ["none", "minor", "major", "critical"] as const;

/**
 * Form for opening a new incident. The first update body becomes the
 * timeline's seed entry; without one the incident page would render empty
 * for users who land before the operator posts a follow-up.
 */
export const createIncidentSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    impact: z.enum(INCIDENT_IMPACTS),
    initialState: z.enum(INCIDENT_STATES).refine((s) => s !== "resolved", {
      message: "A new incident can't start as resolved",
    }),
    initialBody: z.string().min(1, "Initial update body is required").max(4000),
    componentIds: z.array(z.string().min(1)).min(1, "Select at least one component"),
    isScheduled: z.boolean().default(false),
    scheduledFor: z.coerce.date().nullable().optional(),
    scheduledUntil: z.coerce.date().nullable().optional(),
  })
  .refine((v) => !v.isScheduled || (v.scheduledFor != null && v.scheduledUntil != null), {
    message: "Scheduled maintenance requires start + end times",
    path: ["scheduledFor"],
  })
  .refine(
    (v) =>
      !v.isScheduled ||
      v.scheduledFor == null ||
      v.scheduledUntil == null ||
      v.scheduledFor < v.scheduledUntil,
    { message: "End must be after start", path: ["scheduledUntil"] },
  );

export type CreateIncidentValues = z.infer<typeof createIncidentSchema>;

/**
 * Form for adding a timeline update. State at post may be the same as the
 * incident's current state (just adding context) or a transition forward.
 * Resolution is a separate action so we can also stamp `resolvedAt`.
 */
export const addUpdateSchema = z.object({
  body: z.string().min(1, "Update body is required").max(4000),
  stateAtPost: z.enum(INCIDENT_STATES).refine((s) => s !== "resolved", {
    message: "Use 'Resolve' to close the incident",
  }),
});

export type AddUpdateValues = z.infer<typeof addUpdateSchema>;

/**
 * Optional final-update body when resolving. Empty body is allowed (the
 * action stamps a generic "Issue resolved" entry in that case).
 */
export const resolveIncidentSchema = z.object({
  body: z.string().max(4000).optional(),
});

export type ResolveIncidentValues = z.infer<typeof resolveIncidentSchema>;

/**
 * Edit incident metadata (post-create corrections). Slug is intentionally
 * NOT editable - permalinks must stay stable.
 */
export const updateIncidentMetaSchema = z.object({
  title: z.string().min(1).max(200),
  impact: z.enum(INCIDENT_IMPACTS),
  componentIds: z.array(z.string().min(1)).min(1),
});

export type UpdateIncidentMetaValues = z.infer<typeof updateIncidentMetaSchema>;
