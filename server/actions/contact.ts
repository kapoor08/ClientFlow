"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db/client";
import { contactSubmissions } from "@/db/schema";
import { sendContactEmailViaEmailJs } from "@/server/third-party/emailjs";
import { onContactFormSubmitted } from "@/server/email/triggers";
import { verifyTurnstileToken } from "@/server/security/turnstile";

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function getField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitContactFormAction(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const name = getField(formData, "name");
  const email = getField(formData, "email");
  const company = getField(formData, "company");
  const subject = getField(formData, "subject");
  const message = getField(formData, "message");

  if (name.length < 2) {
    return {
      status: "error",
      message: "Enter a valid name.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (!subject) {
    return {
      status: "error",
      message: "Select a subject.",
    };
  }

  if (message.length < 10) {
    return {
      status: "error",
      message: "Add a bit more detail so we can help.",
    };
  }

  // Bot challenge - soft-skipped if TURNSTILE_SECRET_KEY isn't configured.
  const reqHeaders = await headers();
  const remoteIp =
    reqHeaders.get("x-real-ip") ?? reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captcha = await verifyTurnstileToken(getField(formData, "cf-turnstile-response"), remoteIp);
  if (!captcha.ok) {
    return {
      status: "error",
      message: "Could not verify the challenge. Please try again.",
    };
  }

  try {
    const tasks: Promise<unknown>[] = [
      // Persist to database
      db.insert(contactSubmissions).values({
        id: sql`gen_random_uuid()`,
        name,
        email,
        company: company || null,
        subject,
        message,
        status: "new",
      }),

      // Branded HTML templates (internal alert + visitor acknowledgement)
      onContactFormSubmitted({
        name,
        email,
        company,
        subject,
        message,
        internalRecipient: process.env.RESEND_REPLY_TO_EMAIL ?? "",
        orgName: "ClientFlow",
      }),
    ];

    // EmailJS contact template - only when EmailJS is the configured provider
    if (process.env.EMAILJS_PUBLIC_KEY) {
      tasks.push(sendContactEmailViaEmailJs({ name, email, company, subject, message }));
    }

    await Promise.all(tasks);

    return {
      status: "success",
      message: "Your message has been sent. We will get back to you within 24 hours.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to send your message right now.",
    };
  }
}
