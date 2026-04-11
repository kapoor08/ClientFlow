"use server";

import { sendContactEmailViaEmailJs } from "@/lib/emailjs";
import { onContactFormSubmitted } from "@/lib/email-triggers";

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

  try {
    const tasks: Promise<unknown>[] = [
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
      tasks.push(
        sendContactEmailViaEmailJs({ name, email, company, subject, message }),
      );
    }

    await Promise.all(tasks);

    return {
      status: "success",
      message: "Your message has been sent. We will get back to you within 24 hours.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to send your message right now.",
    };
  }
}
