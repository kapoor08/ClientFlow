const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

type EmailJsTemplateParams = Record<string, string>;

// ─── Config ───────────────────────────────────────────────────────────────────

function getEmailJsConfig() {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const contactTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  const transactionalTemplateId = process.env.EMAILJS_TRANSACTIONAL_TEMPLATE_ID;

  return {
    publicKey,
    privateKey,
    serviceId,
    contactTemplateId,
    transactionalTemplateId,
    contactConfigured: Boolean(publicKey && serviceId && contactTemplateId),
    transactionalConfigured: Boolean(
      publicKey && serviceId && transactionalTemplateId,
    ),
  };
}

// ─── Core API call ────────────────────────────────────────────────────────────

async function callEmailJsApi(
  templateId: string,
  templateParams: EmailJsTemplateParams,
) {
  const config = getEmailJsConfig();

  const response = await fetch(EMAILJS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: templateParams,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `EmailJS send failed (${response.status}): ${errorBody || "Unknown error"}`,
    );
  }
}

// ─── Transactional emails ─────────────────────────────────────────────────────
//
// Requires an EmailJS template with these variables:
//   {{to_email}}     — recipient address
//   {{subject}}      — email subject line
//   {{html_content}} — full HTML body (set template body type to HTML in dashboard)

type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmailViaEmailJs(
  input: TransactionalEmailInput,
) {
  const config = getEmailJsConfig();

  if (!config.transactionalConfigured) {
    console.warn(
      "[EmailJS] EMAILJS_TRANSACTIONAL_TEMPLATE_ID is not set. Skipping transactional email delivery.",
    );
    return { delivered: false, reason: "missing-config" as const };
  }

  await callEmailJsApi(config.transactionalTemplateId!, {
    to_email: input.to,
    subject: input.subject,
    html_content: input.html,
  });

  return { delivered: true, reason: null };
}

// ─── Contact form ─────────────────────────────────────────────────────────────

type ContactEmailInput = {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
};

export async function sendContactEmailViaEmailJs(input: ContactEmailInput) {
  const config = getEmailJsConfig();

  if (!config.contactConfigured) {
    throw new Error(
      "EmailJS is not fully configured. Set EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, and EMAILJS_TEMPLATE_ID.",
    );
  }

  const submittedAt = new Date().toISOString();

  await callEmailJsApi(config.contactTemplateId!, {
    app_name: "ClientFlow",
    source: "ClientFlow contact form",
    submitted_at: submittedAt,
    name: input.name,
    full_name: input.name,
    from_name: input.name,
    user_name: input.name,
    email: input.email,
    from_email: input.email,
    user_email: input.email,
    reply_to: input.email,
    company: input.company,
    company_name: input.company,
    subject: input.subject,
    inquiry_subject: input.subject,
    message: input.message,
  });

  return { delivered: true, submittedAt };
}
