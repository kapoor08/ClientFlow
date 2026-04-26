import fs from "node:fs";
import path from "node:path";
import { sendTransactionalEmailViaEmailJs } from "@/server/third-party/emailjs";
import { sendTransactionalEmailViaResend } from "@/server/third-party/resend";
import { isSuppressed } from "@/server/email/suppressions";
import { categoryForModule, isCategoryAllowed } from "@/server/email/category-preferences";
import { getUnsubscribeUrl } from "@/server/email/unsubscribe-token";
import { logger } from "@/server/observability/logger";
import { inngest, isInngestConfigured } from "@/server/queue/inngest-client";
import type { SendEmailInput } from "@/server/email/types";

/**
 * Retry policy for outbound email send.
 *
 * Both providers (Resend, EmailJS) throw a generic Error on any non-success
 * status - they don't expose the HTTP status. We treat *every* failure as
 * potentially transient and retry up to 2 times after the initial attempt.
 *
 * Backoff: 250ms, 1s, 4s. Jitter = ±25% to avoid thundering herd if many
 * sends queue at once and all hit the same Resend incident.
 *
 * If all attempts fail we throw the last error so callers can decide whether
 * to swallow it (Better Auth fallback prints to console) or surface it.
 */
const EMAIL_RETRY_DELAYS_MS = [250, 1000, 4000];

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.5) - Math.floor(ms * 0.25);
}

async function sendWithRetry<T>(
  send: () => Promise<T>,
  ctx: { to: string; tags?: Array<{ name: string; value: string }> },
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < EMAIL_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await send();
    } catch (err) {
      lastErr = err;
      const isLast = attempt === EMAIL_RETRY_DELAYS_MS.length - 1;
      logger.warn("email.send_failed", {
        attempt: attempt + 1,
        maxAttempts: EMAIL_RETRY_DELAYS_MS.length,
        to: ctx.to,
        tags: ctx.tags,
        willRetry: !isLast,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      if (isLast) break;
      await new Promise((resolve) => setTimeout(resolve, jitter(EMAIL_RETRY_DELAYS_MS[attempt])));
    }
  }
  throw lastErr;
}

// ─── Provider routing ─────────────────────────────────────────────────────────
//
// If EMAILJS_PUBLIC_KEY is set → use EmailJS.
// Otherwise → use Resend (requires RESEND_API_KEY + EMAIL_FROM).

// SendEmailInput is exported from server/email/types so the Inngest client
// can reference it without pulling in this file's node:fs imports.
export type { SendEmailInput };

/**
 * Modules whose emails are always delivered, even to suppressed addresses.
 *
 * - `auth`      - password reset, verify email, invite revocation, suspension.
 * - `billing`   - invoices, failed payments, subscription changes, expiring cards.
 * - `security`  - session alerts, forced logout, API-key exposure warnings.
 *
 * The reasoning: unsubscribe = "stop marketing / productivity nags". It is not
 * a signal that the user no longer wants to hear about their account, their
 * money, or threats to either. Everything else (tasks, files, portal, ops,
 * notifications) is suppressible.
 */
const CRITICAL_MODULES = new Set(["auth", "billing", "security"]);

function isCritical(tags?: Array<{ name: string; value: string }>): boolean {
  // Renamed from `module` to dodge Next.js's no-assign-module-variable rule
  // which flags any local named `module` (CommonJS reserved identifier).
  const moduleName = tags?.find((t) => t.name === "module")?.value;
  return moduleName ? CRITICAL_MODULES.has(moduleName) : false;
}

function appendUnsubscribeFooterHtml(html: string, unsubUrl: string): string {
  const footer = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;border-top:1px solid #e5e7eb;"><tr><td style="padding:16px 24px;text-align:center;font-family:-apple-system,'Segoe UI',sans-serif;font-size:12px;color:#9ca3af;line-height:1.5;">You received this email because you have an account at ClientFlow.<br><a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe from non-essential emails</a>.</td></tr></table>`;
  const bodyClose = html.lastIndexOf("</body>");
  return bodyClose === -1
    ? html + footer
    : html.slice(0, bodyClose) + footer + html.slice(bodyClose);
}

function appendUnsubscribeFooterText(text: string, unsubUrl: string): string {
  return `${text}\n\n---\nUnsubscribe from non-essential emails: ${unsubUrl}`;
}

/**
 * Public send entrypoint. Behavior depends on `INNGEST_EVENT_KEY`:
 *
 *   - **Set** (production with Inngest configured): enqueues an
 *     `email/send.requested` event and returns immediately. The actual send
 *     happens in the Inngest worker which calls `sendEmailNow()`. This
 *     decouples Resend latency from the request handler so a slow upstream
 *     doesn't propagate into checkout / signup / password-reset latency.
 *
 *   - **Unset** (local dev, CI, prod-without-Inngest): falls through to a
 *     direct synchronous send. Same code path as before this refactor, so
 *     existing behavior is preserved.
 *
 * Either way, suppression / category / footer logic runs - just at a
 * different point. Tests and existing call sites don't change.
 */
async function sendEmail(input: SendEmailInput) {
  if (isInngestConfigured) {
    await inngest.send({ name: "email/send.requested", data: input });
    return;
  }
  return sendEmailNow(input);
}

/**
 * Performs the actual send. Suppression check → category check → footer →
 * provider with retry. Exported so the Inngest worker can call it.
 */
export async function sendEmailNow(input: SendEmailInput) {
  // Suppression check - skip non-critical sends to unsubscribed / bounced /
  // complained addresses. Critical modules (auth, billing, security) bypass.
  const critical = isCritical(input.tags);
  if (!critical && (await isSuppressed(input.to))) {
    return;
  }

  // Category opt-out check. Honored only for non-critical mail; the user's
  // per-category preferences (product/billing/marketing) are coarser than
  // the per-event notificationPreferences table and apply at the email layer.
  if (!critical) {
    const moduleTag = input.tags?.find((t) => t.name === "module")?.value;
    const category = categoryForModule(moduleTag);
    if (!(await isCategoryAllowed(input.to, category))) {
      return;
    }
  }

  // Every outbound email carries a signed unsubscribe link. Even critical
  // emails include it - so the footer template is stable - but clicking it
  // from a critical email still honors the request for future non-critical
  // sends.
  const unsubUrl = getUnsubscribeUrl(input.to);
  const html = appendUnsubscribeFooterHtml(input.html, unsubUrl);
  // Text body is currently unused by the providers but we keep it enriched
  // in case a future plaintext-capable provider is wired.
  void appendUnsubscribeFooterText(input.text, unsubUrl);

  if (process.env.EMAILJS_PUBLIC_KEY) {
    return sendWithRetry(
      () =>
        sendTransactionalEmailViaEmailJs({
          to: input.to,
          subject: input.subject,
          html,
        }),
      { to: input.to, tags: input.tags },
    );
  }
  return sendWithRetry(
    () =>
      sendTransactionalEmailViaResend({
        to: input.to,
        subject: input.subject,
        html,
      }),
    { to: input.to, tags: input.tags },
  );
}

// ─── Template loader ──────────────────────────────────────────────────────────

const templateCache = new Map<string, string>();

function loadTemplate(slug: string): string {
  if (templateCache.has(slug)) return templateCache.get(slug)!;
  const filePath = path.join(process.cwd(), "emails", "templates", `${slug}.html`);
  const html = fs.readFileSync(filePath, "utf-8");
  templateCache.set(slug, html);
  return html;
}

function fillTemplate(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    html,
  );
}

// ─── Public Contact ───────────────────────────────────────────────────────────

type ContactSubmissionInternalVars = {
  org_name: string;
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  timestamp: string;
};

export async function sendContactSubmissionInternal(
  to: string,
  vars: ContactSubmissionInternalVars,
) {
  return sendEmail({
    to,
    subject: `New contact submission from ${vars.name}`,
    html: fillTemplate(loadTemplate("public.contact_submission_internal"), vars),
    text: `New contact submission from ${vars.name} (${vars.email}) at ${vars.company}.\n\nSubject: ${vars.subject}\n\n${vars.message}\n\nReceived at ${vars.timestamp}.`,
    tags: [{ name: "module", value: "public-contact" }],
  });
}

type ContactSubmissionAckVars = {
  recipient_name: string;
  subject: string;
  support_email: string;
};

export async function sendContactSubmissionAck(to: string, vars: ContactSubmissionAckVars) {
  return sendEmail({
    to,
    subject: `We received your message - ${vars.subject}`,
    html: fillTemplate(loadTemplate("public.contact_submission_ack"), vars),
    text: `Hi ${vars.recipient_name},\n\nThank you for reaching out. We've received your message regarding "${vars.subject}" and will get back to you shortly.\n\nIf you need immediate help, contact us at ${vars.support_email}.`,
    tags: [{ name: "module", value: "public-contact" }],
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type VerifyEmailVars = {
  recipient_name: string;
  action_url: string;
  expires_at: string;
  app_url: string;
};

export async function sendVerifyEmail(to: string, vars: VerifyEmailVars) {
  return sendEmail({
    to,
    subject: "Verify your email address",
    html: fillTemplate(loadTemplate("auth.verify_email"), vars),
    text: `Hi ${vars.recipient_name},\n\nVerify your email: ${vars.action_url}\n\nThis link expires at ${vars.expires_at}.`,
    tags: [
      { name: "category", value: "verify_email" },
      { name: "module", value: "auth" },
    ],
    idempotencyKey: `verify:${to}:${vars.action_url}`,
  });
}

type PasswordResetVars = {
  recipient_name: string;
  action_url: string;
  expires_at: string;
  support_email: string;
};

export async function sendPasswordReset(to: string, vars: PasswordResetVars) {
  return sendEmail({
    to,
    subject: "Reset your password",
    html: fillTemplate(loadTemplate("auth.password_reset"), vars),
    text: `Hi ${vars.recipient_name},\n\nReset your password: ${vars.action_url}\n\nThis link expires at ${vars.expires_at}.\n\nIf you didn't request this, contact ${vars.support_email}.`,
    tags: [
      { name: "category", value: "reset_password" },
      { name: "module", value: "auth" },
    ],
    idempotencyKey: `reset:${to}:${vars.action_url}`,
  });
}

type SignInOtpVars = {
  recipient_name: string;
  otp: string;
  expires_in_minutes: string;
};

export async function sendSignInOtp(to: string, vars: SignInOtpVars) {
  return sendEmail({
    to,
    subject: `Your sign-in code: ${vars.otp}`,
    html: fillTemplate(loadTemplate("auth.sign_in_otp"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour ClientFlow sign-in code is ${vars.otp}. It expires in ${vars.expires_in_minutes} minutes.`,
    tags: [
      { name: "category", value: "sign_in_otp" },
      { name: "module", value: "auth" },
    ],
    idempotencyKey: `signin_otp:${to}:${vars.otp}`,
  });
}

type OrgInviteVars = {
  recipient_name: string;
  org_name: string;
  invite_role: string;
  invited_by_name: string;
  action_url: string;
  expires_at: string;
};

export async function sendOrgInvite(to: string, vars: OrgInviteVars) {
  return sendEmail({
    to,
    subject: `You're invited to join ${vars.org_name}`,
    html: fillTemplate(loadTemplate("auth.organization_invite"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.invited_by_name} has invited you to join ${vars.org_name} as a ${vars.invite_role}.\n\nAccept: ${vars.action_url}\n\nExpires at ${vars.expires_at}.`,
    tags: [{ name: "module", value: "auth" }],
  });
}

type InviteExpiredVars = {
  recipient_name: string;
  org_name: string;
  request_new_invite_url: string;
  support_email: string;
};

export async function sendInviteExpired(to: string, vars: InviteExpiredVars) {
  return sendEmail({
    to,
    subject: `Your invitation to ${vars.org_name} has expired`,
    html: fillTemplate(loadTemplate("auth.invite_expired"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour invitation to join ${vars.org_name} has expired.\n\nRequest a new one: ${vars.request_new_invite_url}\n\nNeed help? Contact ${vars.support_email}.`,
    tags: [{ name: "module", value: "auth" }],
  });
}

type InviteRevokedVars = {
  recipient_name: string;
  org_name: string;
  actor_name: string;
  support_email: string;
};

export async function sendInviteRevoked(to: string, vars: InviteRevokedVars) {
  return sendEmail({
    to,
    subject: `Your invitation to ${vars.org_name} was revoked`,
    html: fillTemplate(loadTemplate("auth.invite_revoked"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour pending invitation to ${vars.org_name} has been revoked by ${vars.actor_name}.\n\nIf you believe this is an error, contact ${vars.support_email}.`,
    tags: [{ name: "module", value: "auth" }],
  });
}

type RiskySignInVars = {
  recipient_name: string;
  device_name: string;
  ip_address: string;
  location: string;
  timestamp: string;
  security_url: string;
};

export async function sendRiskySignInAlert(to: string, vars: RiskySignInVars) {
  return sendEmail({
    to,
    subject: "Unusual sign-in detected on your account",
    html: fillTemplate(loadTemplate("auth.risky_sign_in_alert"), vars),
    text: `Hi ${vars.recipient_name},\n\nWe detected a sign-in from an unrecognized device.\n\nDevice: ${vars.device_name}\nIP: ${vars.ip_address}\nLocation: ${vars.location}\nTime: ${vars.timestamp}\n\nSecure your account: ${vars.security_url}`,
    tags: [
      { name: "module", value: "auth" },
      { name: "category", value: "security_alert" },
    ],
  });
}

type MembershipSuspendedVars = {
  recipient_name: string;
  org_name: string;
  actor_name: string;
  reason: string;
  support_email: string;
};

export async function sendMembershipSuspended(to: string, vars: MembershipSuspendedVars) {
  return sendEmail({
    to,
    subject: `Your access to ${vars.org_name} has been suspended`,
    html: fillTemplate(loadTemplate("auth.membership_suspended"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour membership in ${vars.org_name} has been suspended by ${vars.actor_name}.\n\nReason: ${vars.reason}\n\nContact ${vars.support_email} for assistance.`,
    tags: [{ name: "module", value: "auth" }],
  });
}

// ─── Access ───────────────────────────────────────────────────────────────────

type AccessRequestVars = {
  org_name: string;
  requester_name: string;
  requested_route: string;
  current_role: string;
  action_url: string;
};

export async function sendAccessRequestSubmitted(to: string, vars: AccessRequestVars) {
  return sendEmail({
    to,
    subject: `Access request from ${vars.requester_name}`,
    html: fillTemplate(loadTemplate("access.request_submitted"), vars),
    text: `${vars.requester_name} (role: ${vars.current_role}) has requested access to ${vars.requested_route} in ${vars.org_name}.\n\nReview: ${vars.action_url}`,
    tags: [{ name: "module", value: "access" }],
  });
}

// ─── Organization ─────────────────────────────────────────────────────────────

type RoleChangedVars = {
  recipient_name: string;
  org_name: string;
  actor_name: string;
  old_role: string;
  new_role: string;
};

export async function sendRoleChanged(to: string, vars: RoleChangedVars) {
  return sendEmail({
    to,
    subject: `Your role in ${vars.org_name} has changed`,
    html: fillTemplate(loadTemplate("org.role_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} has changed your role in ${vars.org_name} from ${vars.old_role} to ${vars.new_role}.`,
    tags: [{ name: "module", value: "organization" }],
  });
}

type AccountStatusChangedVars = {
  recipient_name: string;
  org_name: string;
  actor_name: string;
  status: string;
  reason: string;
};

export async function sendAccountStatusChanged(to: string, vars: AccountStatusChangedVars) {
  return sendEmail({
    to,
    subject: `Your account status in ${vars.org_name} has changed`,
    html: fillTemplate(loadTemplate("org.account_status_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour account in ${vars.org_name} has been ${vars.status} by ${vars.actor_name}.\n\nReason: ${vars.reason}`,
    tags: [{ name: "module", value: "organization" }],
  });
}

type OwnershipTransferVars = {
  org_name: string;
  old_owner_name: string;
  new_owner_name: string;
  timestamp: string;
};

export async function sendOwnershipTransferNotice(to: string, vars: OwnershipTransferVars) {
  return sendEmail({
    to,
    subject: `Ownership transfer for ${vars.org_name}`,
    html: fillTemplate(loadTemplate("org.ownership_transfer_notice"), vars),
    text: `Ownership of ${vars.org_name} has been transferred from ${vars.old_owner_name} to ${vars.new_owner_name} on ${vars.timestamp}.`,
    tags: [{ name: "module", value: "organization" }],
  });
}

// ─── Invitations ──────────────────────────────────────────────────────────────

type InviteAcceptedVars = {
  org_name: string;
  accepted_user_name: string;
  invite_role: string;
  timestamp: string;
};

export async function sendInviteAcceptedNotice(to: string, vars: InviteAcceptedVars) {
  return sendEmail({
    to,
    subject: `${vars.accepted_user_name} joined ${vars.org_name}`,
    html: fillTemplate(loadTemplate("invites.accepted_notice"), vars),
    text: `${vars.accepted_user_name} has accepted their invitation and joined ${vars.org_name} as a ${vars.invite_role} on ${vars.timestamp}.`,
    tags: [{ name: "module", value: "invitations" }],
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

type ProjectMembershipChangedVars = {
  recipient_name: string;
  project_name: string;
  actor_name: string;
  status: string;
};

export async function sendProjectMembershipChanged(to: string, vars: ProjectMembershipChangedVars) {
  return sendEmail({
    to,
    subject: `Project membership update: ${vars.project_name}`,
    html: fillTemplate(loadTemplate("projects.membership_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} has ${vars.status} you on the project "${vars.project_name}".`,
    tags: [{ name: "module", value: "projects" }],
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

type TaskAssignmentChangedVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  actor_name: string;
  due_date: string;
};

export async function sendTaskAssignmentChanged(to: string, vars: TaskAssignmentChangedVars) {
  return sendEmail({
    to,
    subject: `Task assigned: ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.assignment_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} has assigned you to "${vars.task_title}" in ${vars.project_name}.\n\nDue: ${vars.due_date}\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskStatusChangedVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  actor_name: string;
  from_status: string;
  to_status: string;
  reason: string;
};

export async function sendTaskStatusChanged(to: string, vars: TaskStatusChangedVars) {
  return sendEmail({
    to,
    subject: `Task updated: ${vars.task_title} -> ${vars.to_status}`,
    html: fillTemplate(loadTemplate("tasks.status_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} moved "${vars.task_title}" in ${vars.project_name} from ${vars.from_status} to ${vars.to_status}.\n\n${vars.reason}\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskMentionedVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  actor_name: string;
  comment_snippet: string;
};

export async function sendTaskMentioned(to: string, vars: TaskMentionedVars) {
  return sendEmail({
    to,
    subject: `${vars.actor_name} mentioned you in ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.mentioned"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} mentioned you in "${vars.task_title}" (${vars.project_name}):\n\n"${vars.comment_snippet}"\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskCommentAddedVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  actor_name: string;
  comment_snippet: string;
};

export async function sendTaskCommentAdded(to: string, vars: TaskCommentAddedVars) {
  return sendEmail({
    to,
    subject: `New comment on ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.comment_added"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} commented on "${vars.task_title}" in ${vars.project_name}:\n\n"${vars.comment_snippet}"\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskDueSoonVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  due_date: string;
};

export async function sendTaskDueSoon(to: string, vars: TaskDueSoonVars) {
  return sendEmail({
    to,
    subject: `Task due soon: ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.due_soon"), vars),
    text: `Hi ${vars.recipient_name},\n\n"${vars.task_title}" in ${vars.project_name} is due on ${vars.due_date}.\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskOverdueVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  due_date: string;
  days_overdue: string;
};

export async function sendTaskOverdue(to: string, vars: TaskOverdueVars) {
  return sendEmail({
    to,
    subject: `Task overdue: ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.overdue"), vars),
    text: `Hi ${vars.recipient_name},\n\n"${vars.task_title}" in ${vars.project_name} is ${vars.days_overdue} days overdue (due ${vars.due_date}).\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

type TaskAttachmentAddedVars = {
  recipient_name: string;
  task_title: string;
  project_name: string;
  task_url: string;
  attachment_name: string;
  actor_name: string;
};

export async function sendTaskAttachmentAdded(to: string, vars: TaskAttachmentAddedVars) {
  return sendEmail({
    to,
    subject: `New attachment on ${vars.task_title}`,
    html: fillTemplate(loadTemplate("tasks.attachment_added"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} added "${vars.attachment_name}" to "${vars.task_title}" in ${vars.project_name}.\n\nView: ${vars.task_url}`,
    tags: [{ name: "module", value: "tasks" }],
  });
}

// ─── Files ────────────────────────────────────────────────────────────────────

type SharedFileUploadedVars = {
  recipient_name: string;
  project_name: string;
  attachment_name: string;
  file_url: string;
  actor_name: string;
};

export async function sendSharedFileUploaded(to: string, vars: SharedFileUploadedVars) {
  return sendEmail({
    to,
    subject: `New file shared in ${vars.project_name}`,
    html: fillTemplate(loadTemplate("files.shared_file_uploaded"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} shared "${vars.attachment_name}" in ${vars.project_name}.\n\nView: ${vars.file_url}`,
    tags: [{ name: "module", value: "files" }],
  });
}

// ─── Client Portal ────────────────────────────────────────────────────────────

type ClientAccessEnabledVars = {
  recipient_name: string;
  org_name: string;
  action_url: string;
  support_email: string;
};

export async function sendClientAccessEnabled(to: string, vars: ClientAccessEnabledVars) {
  return sendEmail({
    to,
    subject: `Your client portal access for ${vars.org_name} is ready`,
    html: fillTemplate(loadTemplate("portal.client_access_enabled"), vars),
    text: `Hi ${vars.recipient_name},\n\nYou now have access to the client portal for ${vars.org_name}.\n\nAccess: ${vars.action_url}\n\nNeed help? Contact ${vars.support_email}.`,
    tags: [{ name: "module", value: "portal" }],
  });
}

// ─── Billing ──────────────────────────────────────────────────────────────────

type UpgradeRequestVars = {
  org_name: string;
  requester_name: string;
  requested_feature: string;
  plan_name: string;
  current_usage: string;
  limit: string;
};

export async function sendUpgradeRequest(to: string, vars: UpgradeRequestVars) {
  return sendEmail({
    to,
    subject: `Upgrade request from ${vars.requester_name}`,
    html: fillTemplate(loadTemplate("billing.contact_owner_upgrade_request"), vars),
    text: `${vars.requester_name} in ${vars.org_name} tried to use ${vars.requested_feature} but hit the ${vars.plan_name} plan limit (${vars.current_usage}/${vars.limit}).`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type UsageLimitWarningVars = {
  org_name: string;
  feature_name: string;
  current_usage: string;
  limit: string;
  plan_name: string;
  action_url: string;
};

export async function sendUsageLimitWarning(to: string, vars: UsageLimitWarningVars) {
  return sendEmail({
    to,
    subject: `Usage warning: ${vars.feature_name} approaching limit`,
    html: fillTemplate(loadTemplate("billing.usage_limit_warning"), vars),
    text: `${vars.org_name} is approaching the ${vars.feature_name} limit on the ${vars.plan_name} plan.\n\nCurrent: ${vars.current_usage} / ${vars.limit}\n\nManage plan: ${vars.action_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type QuotaLimitReachedVars = {
  org_name: string;
  feature_name: string;
  current_usage: string;
  limit: string;
  plan_name: string;
  blocked_action: string;
  action_url: string;
};

export async function sendQuotaLimitReached(to: string, vars: QuotaLimitReachedVars) {
  return sendEmail({
    to,
    subject: `Quota reached: ${vars.feature_name}`,
    html: fillTemplate(loadTemplate("billing.quota_limit_reached"), vars),
    text: `${vars.org_name} has reached the ${vars.feature_name} limit on the ${vars.plan_name} plan (${vars.current_usage}/${vars.limit}).\n\nBlocked action: ${vars.blocked_action}\n\nUpgrade: ${vars.action_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type SubscriptionChangedVars = {
  org_name: string;
  change_type: string;
  old_plan: string;
  new_plan: string;
  timestamp: string;
  action_url: string;
};

export async function sendSubscriptionChanged(to: string, vars: SubscriptionChangedVars) {
  return sendEmail({
    to,
    subject: `Subscription ${vars.change_type}: ${vars.org_name}`,
    html: fillTemplate(loadTemplate("billing.subscription_changed"), vars),
    text: `Your ${vars.org_name} subscription has been ${vars.change_type}.\n\nPrevious plan: ${vars.old_plan}\nNew plan: ${vars.new_plan}\nEffective: ${vars.timestamp}\n\nView billing: ${vars.action_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type InvoiceAvailableVars = {
  recipient_name: string;
  org_name: string;
  invoice_number: string;
  invoice_url: string;
  amount_due: string;
  due_date: string;
};

export async function sendInvoiceAvailable(to: string, vars: InvoiceAvailableVars) {
  return sendEmail({
    to,
    subject: `Invoice #${vars.invoice_number} - ${vars.amount_due} due ${vars.due_date}`,
    html: fillTemplate(loadTemplate("billing.invoice_available"), vars),
    text: `Hi ${vars.recipient_name},\n\nInvoice #${vars.invoice_number} for ${vars.org_name} is ready.\n\nAmount: ${vars.amount_due}\nDue: ${vars.due_date}\n\nView: ${vars.invoice_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type PaymentFailedVars = {
  recipient_name: string;
  org_name: string;
  invoice_number: string;
  amount_due: string;
  failure_reason: string;
  retry_payment_url: string;
};

export async function sendPaymentFailed(to: string, vars: PaymentFailedVars) {
  return sendEmail({
    to,
    subject: `Payment failed for invoice #${vars.invoice_number}`,
    html: fillTemplate(loadTemplate("billing.payment_failed"), vars),
    text: `Hi ${vars.recipient_name},\n\nPayment of ${vars.amount_due} for ${vars.org_name} (invoice #${vars.invoice_number}) has failed.\n\nReason: ${vars.failure_reason}\n\nRetry: ${vars.retry_payment_url}`,
    tags: [
      { name: "module", value: "billing" },
      { name: "category", value: "payment_failed" },
    ],
  });
}

type InvoicePastDueVars = {
  recipient_name: string;
  org_name: string;
  invoice_number: string;
  invoice_url: string;
  amount_due: string;
  due_date: string;
  days_past_due: string;
};

export async function sendInvoicePastDueReminder(to: string, vars: InvoicePastDueVars) {
  return sendEmail({
    to,
    subject: `Invoice #${vars.invoice_number} is ${vars.days_past_due} days past due`,
    html: fillTemplate(loadTemplate("billing.invoice_past_due_reminder"), vars),
    text: `Hi ${vars.recipient_name},\n\nInvoice #${vars.invoice_number} for ${vars.org_name} is ${vars.days_past_due} days past due.\n\nAmount: ${vars.amount_due}\nOriginal due: ${vars.due_date}\n\nView: ${vars.invoice_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type PaymentMethodExpiringVars = {
  recipient_name: string;
  org_name: string;
  payment_method_brand: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  action_url: string;
};

export async function sendPaymentMethodExpiring(to: string, vars: PaymentMethodExpiringVars) {
  return sendEmail({
    to,
    subject: `Payment method expiring soon - ${vars.payment_method_brand} ****${vars.last4}`,
    html: fillTemplate(loadTemplate("billing.payment_method_expiring"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour ${vars.payment_method_brand} ending in ${vars.last4} for ${vars.org_name} expires ${vars.exp_month}/${vars.exp_year}.\n\nUpdate: ${vars.action_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

type PaymentMethodChangedVars = {
  recipient_name: string;
  org_name: string;
  payment_method_brand: string;
  last4: string;
  actor_name: string;
  action_url: string;
};

export async function sendPaymentMethodChanged(to: string, vars: PaymentMethodChangedVars) {
  return sendEmail({
    to,
    subject: `Payment method updated for ${vars.org_name}`,
    html: fillTemplate(loadTemplate("billing.payment_method_changed"), vars),
    text: `Hi ${vars.recipient_name},\n\n${vars.actor_name} updated the payment method for ${vars.org_name} to ${vars.payment_method_brand} ending in ${vars.last4}.\n\nView billing: ${vars.action_url}`,
    tags: [{ name: "module", value: "billing" }],
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────

type SessionActionNoticeVars = {
  recipient_name: string;
  action_type: string;
  session_name: string;
  device_name: string;
  timestamp: string;
  security_url: string;
};

export async function sendSessionActionNotice(to: string, vars: SessionActionNoticeVars) {
  return sendEmail({
    to,
    subject: `Security notice: ${vars.action_type}`,
    html: fillTemplate(loadTemplate("security.session_action_notice"), vars),
    text: `Hi ${vars.recipient_name},\n\nAction: ${vars.action_type}\nSession: ${vars.session_name}\nDevice: ${vars.device_name}\nTime: ${vars.timestamp}\n\nReview: ${vars.security_url}`,
    tags: [
      { name: "module", value: "security" },
      { name: "category", value: "security_alert" },
    ],
  });
}

type ForcedLogoutVars = {
  recipient_name: string;
  policy_name: string;
  timestamp: string;
  action_url: string;
  support_email: string;
};

export async function sendForcedLogoutDueToPolicyNotice(to: string, vars: ForcedLogoutVars) {
  return sendEmail({
    to,
    subject: "You were signed out due to a security policy",
    html: fillTemplate(loadTemplate("security.forced_logout_due_to_policy"), vars),
    text: `Hi ${vars.recipient_name},\n\nYou were signed out at ${vars.timestamp} due to the "${vars.policy_name}" policy.\n\nSign back in: ${vars.action_url}\n\nContact ${vars.support_email} for help.`,
    tags: [
      { name: "module", value: "security" },
      { name: "category", value: "security_alert" },
    ],
  });
}

// ─── Operations ───────────────────────────────────────────────────────────────

type DataExportReadyVars = {
  recipient_name: string;
  export_type: string;
  download_url: string;
  expires_at: string;
  timestamp: string;
};

export async function sendDataExportReady(to: string, vars: DataExportReadyVars) {
  return sendEmail({
    to,
    subject: `Your ${vars.export_type} export is ready`,
    html: fillTemplate(loadTemplate("ops.data_export_ready"), vars),
    text: `Hi ${vars.recipient_name},\n\nYour ${vars.export_type} export is ready.\n\nDownload: ${vars.download_url}\n\nExpires at ${vars.expires_at}.`,
    tags: [{ name: "module", value: "ops" }],
  });
}

type EventIngestionDelayVars = {
  org_name: string;
  affected_stream: string;
  delay_minutes: string;
  timestamp: string;
  action_url: string;
};

export async function sendEventIngestionDelayAlert(to: string, vars: EventIngestionDelayVars) {
  return sendEmail({
    to,
    subject: `Event ingestion delay: ${vars.affected_stream}`,
    html: fillTemplate(loadTemplate("ops.event_ingestion_delay_alert"), vars),
    text: `Event ingestion for ${vars.affected_stream} in ${vars.org_name} is delayed by ${vars.delay_minutes} minutes as of ${vars.timestamp}.\n\nView: ${vars.action_url}`,
    tags: [{ name: "module", value: "ops" }],
  });
}

type BillingWebhookDelayVars = {
  org_name: string;
  provider: string;
  event_type: string;
  delay_minutes: string;
  timestamp: string;
  action_url: string;
};

export async function sendBillingWebhookDelayAlert(to: string, vars: BillingWebhookDelayVars) {
  return sendEmail({
    to,
    subject: `Billing webhook delay: ${vars.provider} - ${vars.event_type}`,
    html: fillTemplate(loadTemplate("ops.billing_webhook_processing_delay_alert"), vars),
    text: `A billing webhook from ${vars.provider} (${vars.event_type}) for ${vars.org_name} is delayed by ${vars.delay_minutes} minutes.\n\nInvestigate: ${vars.action_url}`,
    tags: [{ name: "module", value: "ops" }],
  });
}

type NotificationDeliveryFailureVars = {
  org_name: string;
  failed_channel: string;
  failure_count: string;
  last_error: string;
  action_url: string;
};

export async function sendNotificationDeliveryFailureDigest(
  to: string,
  vars: NotificationDeliveryFailureVars,
) {
  return sendEmail({
    to,
    subject: `Notification delivery failures: ${vars.failed_channel}`,
    html: fillTemplate(loadTemplate("ops.notification_delivery_failure_digest"), vars),
    text: `${vars.failure_count} notification delivery failures on ${vars.failed_channel} for ${vars.org_name}.\n\nLast error: ${vars.last_error}\n\nView: ${vars.action_url}`,
    tags: [{ name: "module", value: "ops" }],
  });
}

type WebhookVerificationFailedVars = {
  org_name: string;
  integration_name: string;
  endpoint_url: string;
  failure_reason: string;
  action_url: string;
};

export async function sendWebhookEndpointVerificationFailed(
  to: string,
  vars: WebhookVerificationFailedVars,
) {
  return sendEmail({
    to,
    subject: `Webhook verification failed: ${vars.integration_name}`,
    html: fillTemplate(loadTemplate("ops.webhook_endpoint_verification_failed"), vars),
    text: `Webhook endpoint verification for ${vars.integration_name} in ${vars.org_name} has failed.\n\nEndpoint: ${vars.endpoint_url}\nReason: ${vars.failure_reason}\n\nFix: ${vars.action_url}`,
    tags: [{ name: "module", value: "ops" }],
  });
}

type ApiKeyExposureWarningVars = {
  org_name: string;
  integration_name: string;
  key_name: string;
  timestamp: string;
  action_url: string;
};

export async function sendApiKeyExposureWarning(to: string, vars: ApiKeyExposureWarningVars) {
  return sendEmail({
    to,
    subject: `API key exposure warning: ${vars.key_name}`,
    html: fillTemplate(loadTemplate("ops.api_key_exposure_warning"), vars),
    text: `A potential API key exposure has been detected for ${vars.key_name} (${vars.integration_name}) in ${vars.org_name} at ${vars.timestamp}.\n\nRotate key: ${vars.action_url}`,
    tags: [
      { name: "module", value: "ops" },
      { name: "category", value: "security_alert" },
    ],
  });
}

type RateLimitAbuseBlockVars = {
  org_name: string;
  route_key: string;
  block_scope: string;
  expires_at: string;
  timestamp: string;
  action_url: string;
};

export async function sendRateLimitAbuseBlockAlert(to: string, vars: RateLimitAbuseBlockVars) {
  return sendEmail({
    to,
    subject: `Rate limit block activated: ${vars.route_key}`,
    html: fillTemplate(loadTemplate("ops.rate_limit_abuse_block_alert"), vars),
    text: `A rate limit block has been activated for ${vars.route_key} in ${vars.org_name}.\n\nScope: ${vars.block_scope}\nExpires: ${vars.expires_at}\n\nReview: ${vars.action_url}`,
    tags: [{ name: "module", value: "ops" }],
  });
}

// ─── Backward-compatible exports (used by lib/auth.ts) ───────────────────────

export async function sendVerificationEmailViaResend({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  return sendVerifyEmail(email, {
    recipient_name: email,
    action_url: url,
    expires_at: "",
    app_url: process.env.NEXT_PUBLIC_APP_URL ?? "",
  });
}

export async function sendResetPasswordEmailViaResend({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  return sendPasswordReset(email, {
    recipient_name: email,
    action_url: url,
    expires_at: "",
    support_email: process.env.RESEND_REPLY_TO_EMAIL ?? "",
  });
}

// ─── Generic notification email ───────────────────────────────────────────────

type GenericNotificationVars = {
  recipient_name: string;
  title: string;
  body?: string;
  action_url?: string;
};

export async function sendGenericNotification(to: string, vars: GenericNotificationVars) {
  const bodyParagraph = vars.body
    ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#6b7280;">${vars.body}</p>`
    : "";
  const actionButton = vars.action_url
    ? `<div style="margin:20px 0;"><a href="${vars.action_url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:-0.1px;">View Details</a></div>`
    : "";

  return sendEmail({
    to,
    subject: vars.title,
    html: fillTemplate(loadTemplate("notifications.generic"), {
      recipient_name: vars.recipient_name,
      title: vars.title,
      body_paragraph: bodyParagraph,
      action_button: actionButton,
    }),
    text: `${vars.title}\n\n${vars.body ?? ""}${vars.action_url ? `\n\n${vars.action_url}` : ""}`,
    tags: [{ name: "module", value: "notifications" }],
  });
}
