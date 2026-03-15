import {
  sendContactSubmissionInternal,
  sendContactSubmissionAck,
  sendOrgInvite,
  sendInviteExpired,
  sendInviteRevoked,
  sendRiskySignInAlert,
  sendMembershipSuspended,
  sendAccessRequestSubmitted,
  sendRoleChanged,
  sendAccountStatusChanged,
  sendOwnershipTransferNotice,
  sendInviteAcceptedNotice,
  sendProjectMembershipChanged,
  sendTaskAssignmentChanged,
  sendTaskStatusChanged,
  sendTaskMentioned,
  sendTaskCommentAdded,
  sendTaskDueSoon,
  sendTaskOverdue,
  sendTaskAttachmentAdded,
  sendSharedFileUploaded,
  sendClientAccessEnabled,
  sendUpgradeRequest,
  sendUsageLimitWarning,
  sendQuotaLimitReached,
  sendSubscriptionChanged,
  sendInvoiceAvailable,
  sendPaymentFailed,
  sendInvoicePastDueReminder,
  sendPaymentMethodExpiring,
  sendPaymentMethodChanged,
  sendSessionActionNotice,
  sendForcedLogoutDueToPolicyNotice,
  sendDataExportReady,
  sendEventIngestionDelayAlert,
  sendBillingWebhookDelayAlert,
  sendNotificationDeliveryFailureDigest,
  sendWebhookEndpointVerificationFailed,
  sendApiKeyExposureWarning,
  sendRateLimitAbuseBlockAlert,
} from "@/lib/email";

// ─── Shared domain types ──────────────────────────────────────────────────────

type EmailUser = { id: string; name: string; email: string };
type EmailOrg = { id: string; name: string };
type EmailProject = { id: string; name: string };
type EmailTask = { id: string; title: string; dueDate?: Date | null };
type EmailAttachment = { fileName: string; url: string };
type EmailInvoice = {
  number: string;
  amountDue: string;
  dueDate: string;
};
type EmailCard = {
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

function taskUrl(taskId: string) {
  return `${appUrl()}/tasks/${taskId}`;
}

function formatDate(date?: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatNow() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── Public Contact ───────────────────────────────────────────────────────────

type ContactFormInput = {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  internalRecipient: string;
  orgName: string;
};

/** Triggered when a visitor submits the public contact form. */
export async function onContactFormSubmitted(input: ContactFormInput) {
  const timestamp = formatNow();

  await Promise.all([
    // Notify internal team
    sendContactSubmissionInternal(input.internalRecipient, {
      org_name: input.orgName,
      name: input.name,
      email: input.email,
      company: input.company,
      subject: input.subject,
      message: input.message,
      timestamp,
    }),
    // Acknowledge the visitor
    sendContactSubmissionAck(input.email, {
      recipient_name: input.name,
      subject: input.subject,
      support_email: input.internalRecipient,
    }),
  ]);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type InviteInput = {
  invitee: EmailUser;
  org: EmailOrg;
  invitedBy: EmailUser;
  role: string;
  actionUrl: string;
  expiresAt: Date;
};

/** Triggered when a user is invited to an organization. */
export async function onUserInvited(input: InviteInput) {
  return sendOrgInvite(input.invitee.email, {
    recipient_name: input.invitee.name,
    org_name: input.org.name,
    invite_role: input.role,
    invited_by_name: input.invitedBy.name,
    action_url: input.actionUrl,
    expires_at: formatDate(input.expiresAt),
  });
}

type InviteExpiredInput = {
  invitee: EmailUser;
  org: EmailOrg;
  requestNewInviteUrl: string;
  supportEmail: string;
};

/** Triggered when an invitation token expires. */
export async function onInviteExpired(input: InviteExpiredInput) {
  return sendInviteExpired(input.invitee.email, {
    recipient_name: input.invitee.name,
    org_name: input.org.name,
    request_new_invite_url: input.requestNewInviteUrl,
    support_email: input.supportEmail,
  });
}

type InviteRevokedInput = {
  invitee: EmailUser;
  org: EmailOrg;
  actor: EmailUser;
  supportEmail: string;
};

/** Triggered when an admin revokes a pending invitation. */
export async function onInviteRevoked(input: InviteRevokedInput) {
  return sendInviteRevoked(input.invitee.email, {
    recipient_name: input.invitee.name,
    org_name: input.org.name,
    actor_name: input.actor.name,
    support_email: input.supportEmail,
  });
}

type RiskySignInInput = {
  user: EmailUser;
  deviceName: string;
  ipAddress: string;
  location: string;
  securityUrl: string;
};

/** Triggered on sign-in from an unrecognized device or suspicious context. */
export async function onRiskySignIn(input: RiskySignInInput) {
  return sendRiskySignInAlert(input.user.email, {
    recipient_name: input.user.name,
    device_name: input.deviceName,
    ip_address: input.ipAddress,
    location: input.location,
    timestamp: formatNow(),
    security_url: input.securityUrl,
  });
}

type MembershipSuspendedInput = {
  member: EmailUser;
  org: EmailOrg;
  actor: EmailUser;
  reason: string;
  supportEmail: string;
};

/** Triggered when a member's access is suspended. */
export async function onMembershipSuspended(input: MembershipSuspendedInput) {
  return sendMembershipSuspended(input.member.email, {
    recipient_name: input.member.name,
    org_name: input.org.name,
    actor_name: input.actor.name,
    reason: input.reason,
    support_email: input.supportEmail,
  });
}

// ─── Access ───────────────────────────────────────────────────────────────────

type AccessRequestInput = {
  requester: EmailUser;
  org: EmailOrg;
  recipients: EmailUser[];
  requestedRoute: string;
  currentRole: string;
  reviewUrl: string;
};

/** Triggered when a user requests access to a restricted route. */
export async function onAccessRequestSubmitted(input: AccessRequestInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendAccessRequestSubmitted(recipient.email, {
        org_name: input.org.name,
        requester_name: input.requester.name,
        requested_route: input.requestedRoute,
        current_role: input.currentRole,
        action_url: input.reviewUrl,
      }),
    ),
  );
}

// ─── Organization ─────────────────────────────────────────────────────────────

type RoleChangedInput = {
  member: EmailUser;
  org: EmailOrg;
  actor: EmailUser;
  oldRole: string;
  newRole: string;
};

/** Triggered when a member's role is changed. */
export async function onRoleChanged(input: RoleChangedInput) {
  return sendRoleChanged(input.member.email, {
    recipient_name: input.member.name,
    org_name: input.org.name,
    actor_name: input.actor.name,
    old_role: input.oldRole,
    new_role: input.newRole,
  });
}

type AccountStatusChangedInput = {
  member: EmailUser;
  org: EmailOrg;
  actor: EmailUser;
  status: string;
  reason: string;
};

/** Triggered when a member is suspended or reactivated. */
export async function onAccountStatusChanged(input: AccountStatusChangedInput) {
  return sendAccountStatusChanged(input.member.email, {
    recipient_name: input.member.name,
    org_name: input.org.name,
    actor_name: input.actor.name,
    status: input.status,
    reason: input.reason,
  });
}

type OwnershipTransferInput = {
  org: EmailOrg;
  oldOwner: EmailUser;
  newOwner: EmailUser;
  recipients: EmailUser[];
};

/** Triggered when organization ownership is transferred. Notifies both parties. */
export async function onOwnershipTransferred(input: OwnershipTransferInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendOwnershipTransferNotice(recipient.email, {
        org_name: input.org.name,
        old_owner_name: input.oldOwner.name,
        new_owner_name: input.newOwner.name,
        timestamp,
      }),
    ),
  );
}

// ─── Invitations ──────────────────────────────────────────────────────────────

type InviteAcceptedInput = {
  acceptedUser: EmailUser;
  org: EmailOrg;
  role: string;
  recipients: EmailUser[];
};

/** Triggered when an invited user accepts their invitation. */
export async function onInviteAccepted(input: InviteAcceptedInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendInviteAcceptedNotice(recipient.email, {
        org_name: input.org.name,
        accepted_user_name: input.acceptedUser.name,
        invite_role: input.role,
        timestamp,
      }),
    ),
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────

type ProjectMembershipInput = {
  member: EmailUser;
  project: EmailProject;
  actor: EmailUser;
  status: "added" | "removed";
};

/** Triggered when a user is added to or removed from a project. */
export async function onProjectMembershipChanged(
  input: ProjectMembershipInput,
) {
  return sendProjectMembershipChanged(input.member.email, {
    recipient_name: input.member.name,
    project_name: input.project.name,
    actor_name: input.actor.name,
    status: input.status,
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

type TaskAssignedInput = {
  assignee: EmailUser;
  task: EmailTask;
  project: EmailProject;
  actor: EmailUser;
};

/** Triggered when a task is assigned or reassigned. */
export async function onTaskAssigned(input: TaskAssignedInput) {
  return sendTaskAssignmentChanged(input.assignee.email, {
    recipient_name: input.assignee.name,
    task_title: input.task.title,
    project_name: input.project.name,
    task_url: taskUrl(input.task.id),
    actor_name: input.actor.name,
    due_date: formatDate(input.task.dueDate),
  });
}

type TaskStatusChangedInput = {
  recipients: EmailUser[];
  task: EmailTask;
  project: EmailProject;
  actor: EmailUser;
  fromStatus: string;
  toStatus: string;
  reason?: string;
};

/** Triggered when a task moves between statuses. Notifies all watchers. */
export async function onTaskStatusChanged(input: TaskStatusChangedInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendTaskStatusChanged(recipient.email, {
        recipient_name: recipient.name,
        task_title: input.task.title,
        project_name: input.project.name,
        task_url: taskUrl(input.task.id),
        actor_name: input.actor.name,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        reason: input.reason ?? "",
      }),
    ),
  );
}

type TaskMentionedInput = {
  mentioned: EmailUser;
  task: EmailTask;
  project: EmailProject;
  actor: EmailUser;
  commentSnippet: string;
};

/** Triggered when a user is @mentioned in a task comment. */
export async function onTaskMentioned(input: TaskMentionedInput) {
  return sendTaskMentioned(input.mentioned.email, {
    recipient_name: input.mentioned.name,
    task_title: input.task.title,
    project_name: input.project.name,
    task_url: taskUrl(input.task.id),
    actor_name: input.actor.name,
    comment_snippet: input.commentSnippet,
  });
}

type TaskCommentAddedInput = {
  recipients: EmailUser[];
  task: EmailTask;
  project: EmailProject;
  actor: EmailUser;
  commentSnippet: string;
};

/** Triggered when a new comment is added to a followed task. */
export async function onTaskCommentAdded(input: TaskCommentAddedInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendTaskCommentAdded(recipient.email, {
        recipient_name: recipient.name,
        task_title: input.task.title,
        project_name: input.project.name,
        task_url: taskUrl(input.task.id),
        actor_name: input.actor.name,
        comment_snippet: input.commentSnippet,
      }),
    ),
  );
}

type TaskDueSoonInput = {
  assignee: EmailUser;
  task: EmailTask;
  project: EmailProject;
};

/** Triggered when a task's due date threshold is reached. */
export async function onTaskDueSoon(input: TaskDueSoonInput) {
  return sendTaskDueSoon(input.assignee.email, {
    recipient_name: input.assignee.name,
    task_title: input.task.title,
    project_name: input.project.name,
    task_url: taskUrl(input.task.id),
    due_date: formatDate(input.task.dueDate),
  });
}

type TaskOverdueInput = {
  recipients: EmailUser[];
  task: EmailTask;
  project: EmailProject;
  daysOverdue: number;
};

/** Triggered when a task passes its due date. */
export async function onTaskOverdue(input: TaskOverdueInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendTaskOverdue(recipient.email, {
        recipient_name: recipient.name,
        task_title: input.task.title,
        project_name: input.project.name,
        task_url: taskUrl(input.task.id),
        due_date: formatDate(input.task.dueDate),
        days_overdue: String(input.daysOverdue),
      }),
    ),
  );
}

type TaskAttachmentAddedInput = {
  recipients: EmailUser[];
  task: EmailTask;
  project: EmailProject;
  actor: EmailUser;
  attachment: EmailAttachment;
};

/** Triggered when a file is attached to a task. */
export async function onTaskAttachmentAdded(input: TaskAttachmentAddedInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendTaskAttachmentAdded(recipient.email, {
        recipient_name: recipient.name,
        task_title: input.task.title,
        project_name: input.project.name,
        task_url: taskUrl(input.task.id),
        attachment_name: input.attachment.fileName,
        actor_name: input.actor.name,
      }),
    ),
  );
}

// ─── Files ────────────────────────────────────────────────────────────────────

type FileSharedInput = {
  recipients: EmailUser[];
  project: EmailProject;
  actor: EmailUser;
  attachment: EmailAttachment;
};

/** Triggered when a file is shared directly in a project. */
export async function onFileShared(input: FileSharedInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendSharedFileUploaded(recipient.email, {
        recipient_name: recipient.name,
        project_name: input.project.name,
        attachment_name: input.attachment.fileName,
        file_url: input.attachment.url,
        actor_name: input.actor.name,
      }),
    ),
  );
}

// ─── Client Portal ────────────────────────────────────────────────────────────

type ClientAccessGrantedInput = {
  client: EmailUser;
  org: EmailOrg;
  portalUrl: string;
  supportEmail: string;
};

/** Triggered the first time a client is granted portal access. */
export async function onClientAccessGranted(input: ClientAccessGrantedInput) {
  return sendClientAccessEnabled(input.client.email, {
    recipient_name: input.client.name,
    org_name: input.org.name,
    action_url: input.portalUrl,
    support_email: input.supportEmail,
  });
}

// ─── Billing ──────────────────────────────────────────────────────────────────

type UpgradeRequestedInput = {
  owner: EmailUser;
  org: EmailOrg;
  requester: EmailUser;
  requestedFeature: string;
  planName: string;
  currentUsage: number;
  limit: number;
};

/** Triggered when a non-owner hits a plan gate and requests an upgrade. */
export async function onUpgradeRequested(input: UpgradeRequestedInput) {
  return sendUpgradeRequest(input.owner.email, {
    org_name: input.org.name,
    requester_name: input.requester.name,
    requested_feature: input.requestedFeature,
    plan_name: input.planName,
    current_usage: String(input.currentUsage),
    limit: String(input.limit),
  });
}

type UsageLimitWarningInput = {
  owner: EmailUser;
  org: EmailOrg;
  featureName: string;
  planName: string;
  currentUsage: number;
  limit: number;
  manageUrl: string;
};

/** Triggered when usage approaches the plan quota threshold. */
export async function onUsageLimitWarning(input: UsageLimitWarningInput) {
  return sendUsageLimitWarning(input.owner.email, {
    org_name: input.org.name,
    feature_name: input.featureName,
    current_usage: String(input.currentUsage),
    limit: String(input.limit),
    plan_name: input.planName,
    action_url: input.manageUrl,
  });
}

type QuotaLimitReachedInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  featureName: string;
  planName: string;
  currentUsage: number;
  limit: number;
  blockedAction: string;
  upgradeUrl: string;
};

/** Triggered when a quota is fully exhausted and an action is blocked. */
export async function onQuotaLimitReached(input: QuotaLimitReachedInput) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendQuotaLimitReached(recipient.email, {
        org_name: input.org.name,
        feature_name: input.featureName,
        current_usage: String(input.currentUsage),
        limit: String(input.limit),
        plan_name: input.planName,
        blocked_action: input.blockedAction,
        action_url: input.upgradeUrl,
      }),
    ),
  );
}

type SubscriptionChangedInput = {
  owner: EmailUser;
  org: EmailOrg;
  changeType: "upgraded" | "downgraded" | "cancelled" | "resumed";
  oldPlan: string;
  newPlan: string;
  billingUrl: string;
};

/** Triggered on any subscription lifecycle change. */
export async function onSubscriptionChanged(input: SubscriptionChangedInput) {
  return sendSubscriptionChanged(input.owner.email, {
    org_name: input.org.name,
    change_type: input.changeType,
    old_plan: input.oldPlan,
    new_plan: input.newPlan,
    timestamp: formatNow(),
    action_url: input.billingUrl,
  });
}

type InvoiceAvailableInput = {
  owner: EmailUser;
  org: EmailOrg;
  invoice: EmailInvoice;
  invoiceUrl: string;
};

/** Triggered when a new invoice is issued and ready to view. */
export async function onInvoiceAvailable(input: InvoiceAvailableInput) {
  return sendInvoiceAvailable(input.owner.email, {
    recipient_name: input.owner.name,
    org_name: input.org.name,
    invoice_number: input.invoice.number,
    invoice_url: input.invoiceUrl,
    amount_due: input.invoice.amountDue,
    due_date: input.invoice.dueDate,
  });
}

type PaymentFailedInput = {
  owner: EmailUser;
  org: EmailOrg;
  invoice: EmailInvoice;
  failureReason: string;
  retryUrl: string;
};

/** Triggered when a payment attempt fails. */
export async function onPaymentFailed(input: PaymentFailedInput) {
  return sendPaymentFailed(input.owner.email, {
    recipient_name: input.owner.name,
    org_name: input.org.name,
    invoice_number: input.invoice.number,
    amount_due: input.invoice.amountDue,
    failure_reason: input.failureReason,
    retry_payment_url: input.retryUrl,
  });
}

type InvoicePastDueInput = {
  owner: EmailUser;
  org: EmailOrg;
  invoice: EmailInvoice;
  invoiceUrl: string;
  daysPastDue: number;
};

/** Triggered when an invoice passes its due date. */
export async function onInvoicePastDue(input: InvoicePastDueInput) {
  return sendInvoicePastDueReminder(input.owner.email, {
    recipient_name: input.owner.name,
    org_name: input.org.name,
    invoice_number: input.invoice.number,
    invoice_url: input.invoiceUrl,
    amount_due: input.invoice.amountDue,
    due_date: input.invoice.dueDate,
    days_past_due: String(input.daysPastDue),
  });
}

type PaymentMethodExpiringInput = {
  owner: EmailUser;
  org: EmailOrg;
  card: EmailCard;
  updateUrl: string;
};

/** Triggered when a saved payment method is about to expire. */
export async function onPaymentMethodExpiring(
  input: PaymentMethodExpiringInput,
) {
  return sendPaymentMethodExpiring(input.owner.email, {
    recipient_name: input.owner.name,
    org_name: input.org.name,
    payment_method_brand: input.card.brand,
    last4: input.card.last4,
    exp_month: input.card.expMonth,
    exp_year: input.card.expYear,
    action_url: input.updateUrl,
  });
}

type PaymentMethodChangedInput = {
  owner: EmailUser;
  org: EmailOrg;
  actor: EmailUser;
  card: Pick<EmailCard, "brand" | "last4">;
  billingUrl: string;
};

/** Triggered when a payment method is added, replaced, or removed. */
export async function onPaymentMethodChanged(input: PaymentMethodChangedInput) {
  return sendPaymentMethodChanged(input.owner.email, {
    recipient_name: input.owner.name,
    org_name: input.org.name,
    payment_method_brand: input.card.brand,
    last4: input.card.last4,
    actor_name: input.actor.name,
    action_url: input.billingUrl,
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────

type SessionRevokedInput = {
  user: EmailUser;
  actionType: string;
  sessionName: string;
  deviceName: string;
  securityUrl: string;
};

/** Triggered when a session is revoked or all devices are signed out. */
export async function onSessionRevoked(input: SessionRevokedInput) {
  return sendSessionActionNotice(input.user.email, {
    recipient_name: input.user.name,
    action_type: input.actionType,
    session_name: input.sessionName,
    device_name: input.deviceName,
    timestamp: formatNow(),
    security_url: input.securityUrl,
  });
}

type ForcedLogoutInput = {
  user: EmailUser;
  policyName: string;
  signInUrl: string;
  supportEmail: string;
};

/** Triggered when a user is forcefully signed out by an org or security policy. */
export async function onForcedLogout(input: ForcedLogoutInput) {
  return sendForcedLogoutDueToPolicyNotice(input.user.email, {
    recipient_name: input.user.name,
    policy_name: input.policyName,
    timestamp: formatNow(),
    action_url: input.signInUrl,
    support_email: input.supportEmail,
  });
}

// ─── Operations ───────────────────────────────────────────────────────────────

type DataExportReadyInput = {
  requester: EmailUser;
  exportType: string;
  downloadUrl: string;
  expiresAt: Date;
};

/** Triggered when an async data or audit export job completes. */
export async function onDataExportReady(input: DataExportReadyInput) {
  return sendDataExportReady(input.requester.email, {
    recipient_name: input.requester.name,
    export_type: input.exportType,
    download_url: input.downloadUrl,
    expires_at: formatDate(input.expiresAt),
    timestamp: formatNow(),
  });
}

type EventIngestionDelayInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  affectedStream: string;
  delayMinutes: number;
  statusUrl: string;
};

/** Triggered when the event pipeline exceeds the delay threshold. */
export async function onEventIngestionDelay(input: EventIngestionDelayInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendEventIngestionDelayAlert(recipient.email, {
        org_name: input.org.name,
        affected_stream: input.affectedStream,
        delay_minutes: String(input.delayMinutes),
        timestamp,
        action_url: input.statusUrl,
      }),
    ),
  );
}

type BillingWebhookDelayInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  provider: string;
  eventType: string;
  delayMinutes: number;
  actionUrl: string;
};

/** Triggered when a billing webhook is delayed beyond the threshold. */
export async function onBillingWebhookDelay(input: BillingWebhookDelayInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendBillingWebhookDelayAlert(recipient.email, {
        org_name: input.org.name,
        provider: input.provider,
        event_type: input.eventType,
        delay_minutes: String(input.delayMinutes),
        timestamp,
        action_url: input.actionUrl,
      }),
    ),
  );
}

type NotificationDeliveryFailureInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  failedChannel: string;
  failureCount: number;
  lastError: string;
  actionUrl: string;
};

/** Triggered when notification delivery failures exceed the threshold. */
export async function onNotificationDeliveryFailure(
  input: NotificationDeliveryFailureInput,
) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendNotificationDeliveryFailureDigest(recipient.email, {
        org_name: input.org.name,
        failed_channel: input.failedChannel,
        failure_count: String(input.failureCount),
        last_error: input.lastError,
        action_url: input.actionUrl,
      }),
    ),
  );
}

type WebhookVerificationFailedInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  integrationName: string;
  endpointUrl: string;
  failureReason: string;
  fixUrl: string;
};

/** Triggered when a webhook endpoint fails verification. */
export async function onWebhookVerificationFailed(
  input: WebhookVerificationFailedInput,
) {
  return Promise.all(
    input.recipients.map((recipient) =>
      sendWebhookEndpointVerificationFailed(recipient.email, {
        org_name: input.org.name,
        integration_name: input.integrationName,
        endpoint_url: input.endpointUrl,
        failure_reason: input.failureReason,
        action_url: input.fixUrl,
      }),
    ),
  );
}

type ApiKeyExposureInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  integrationName: string;
  keyName: string;
  rotateUrl: string;
};

/** Triggered when a potential API key exposure is detected. */
export async function onApiKeyExposureDetected(input: ApiKeyExposureInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendApiKeyExposureWarning(recipient.email, {
        org_name: input.org.name,
        integration_name: input.integrationName,
        key_name: input.keyName,
        timestamp,
        action_url: input.rotateUrl,
      }),
    ),
  );
}

type RateLimitBlockInput = {
  recipients: EmailUser[];
  org: EmailOrg;
  routeKey: string;
  blockScope: string;
  expiresAt: Date;
  reviewUrl: string;
};

/** Triggered when a rate limit abuse block is activated. */
export async function onRateLimitBlockActivated(input: RateLimitBlockInput) {
  const timestamp = formatNow();
  return Promise.all(
    input.recipients.map((recipient) =>
      sendRateLimitAbuseBlockAlert(recipient.email, {
        org_name: input.org.name,
        route_key: input.routeKey,
        block_scope: input.blockScope,
        expires_at: formatDate(input.expiresAt),
        timestamp,
        action_url: input.reviewUrl,
      }),
    ),
  );
}
