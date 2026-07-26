import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().int().nonnegative(),
  unitPriceCents: z.number().int(),
});

/**
 * PATCH body for a manual invoice. Every field is optional (partial update).
 *
 * `status` is deliberately NOT accepted here (P2-7): status transitions go
 * through the dedicated `mark_paid` / `mark_sent` actions, so allowing an
 * arbitrary `status` string on the general update was pure injection surface.
 * Unknown keys (a stray `status`, `action`, etc.) are stripped by zod's default
 * object behavior, so they never reach the DB write.
 */
export const invoiceUpdateSchema = z.object({
  clientId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  number: z.string().optional(),
  currencyCode: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  notes: z.string().optional(),
  dueAt: z.string().optional(), // ISO date string
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
