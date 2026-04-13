import { z } from "zod";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const adminSupportSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(""),
  priority: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
});

export const adminContactSearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  status: parseAsString.withDefault(""),
});

export const adminReplySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1, "Reply cannot be empty.").max(5000),
  isInternal: z.boolean().default(false),
});
export type AdminReplyValues = z.infer<typeof adminReplySchema>;

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["open", "in_progress", "waiting_on_user", "resolved", "closed"]),
});

export const assignTicketSchema = z.object({
  ticketId: z.string().min(1),
  adminUserId: z.string().nullable(),
});

export const processContactSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  notes: z.string().max(1000).optional(),
});
