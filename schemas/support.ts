import { z } from "zod";

export const TICKET_CATEGORIES = [
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical Issue" },
  { value: "general", label: "General Question" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const createTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(200),
  description: z
    .string()
    .min(20, "Please provide more detail (at least 20 characters).")
    .max(5000),
  category: z.enum(["billing", "technical", "general", "feature_request", "bug_report"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});
export type CreateTicketValues = z.infer<typeof createTicketSchema>;

export const addMessageSchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1, "Message cannot be empty.").max(5000),
});
export type AddMessageValues = z.infer<typeof addMessageSchema>;
