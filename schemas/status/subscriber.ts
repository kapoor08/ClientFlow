import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email address").max(320),
  // Cloudflare Turnstile token. Optional - the server's Turnstile verifier
  // soft-fails when TURNSTILE_SECRET_KEY isn't configured (typical in dev).
  turnstileToken: z.string().optional().or(z.literal("")),
});

export type SubscribeValues = z.infer<typeof subscribeSchema>;
