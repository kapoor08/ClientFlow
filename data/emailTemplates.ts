export interface EmailTemplate {
  slug: string;
  module: string;
  audience: string;
  trigger: string;
  variables: string[];
  priority: "P0" | "P1" | "P2";
  status: "Required" | "Recommended" | "Conditional";
  phase: 1 | 2 | 3;
  subject: string;
  previewBody: string;
}

export interface EmailCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  templates: EmailTemplate[];
}

const templates: EmailTemplate[] = [
  // === PUBLIC CONTACT ===
  {
    slug: "public.contact_submission_internal",
    module: "Public Contact",
    audience: "Sales/support owner/admin",
    trigger: "Public contact form submitted",
    variables: [
      "org_name",
      "name",
      "email",
      "company",
      "subject",
      "message",
      "timestamp",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "New contact submission from {{name}}",
    previewBody:
      "A new contact form submission has been received from {{name}} ({{email}}) at {{company}}.\n\nSubject: {{subject}}\n\n{{message}}\n\nReceived at {{timestamp}}.",
  },
  {
    slug: "public.contact_submission_ack",
    module: "Public Contact",
    audience: "Visitor",
    trigger: "Public contact form submitted",
    variables: ["recipient_name", "subject", "support_email"],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "We received your message - {{subject}}",
    previewBody:
      'Hi {{recipient_name}},\n\nThank you for reaching out. We\'ve received your message regarding "{{subject}}" and will get back to you shortly.\n\nIf you need immediate help, contact us at {{support_email}}.',
  },

  // === AUTH ===
  {
    slug: "auth.verify_email",
    module: "Auth",
    audience: "All users",
    trigger: "Sign-up, resend verification, policy-enforced verification",
    variables: ["recipient_name", "action_url", "expires_at", "app_url"],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Verify your email address",
    previewBody:
      "Hi {{recipient_name}},\n\nPlease verify your email address to complete your account setup.\n\n[Verify Email]({{action_url}})\n\nThis link expires at {{expires_at}}.",
  },
  {
    slug: "auth.password_reset",
    module: "Auth",
    audience: "All users",
    trigger: "Forgot-password request",
    variables: ["recipient_name", "action_url", "expires_at", "support_email"],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Reset your password",
    previewBody:
      "Hi {{recipient_name}},\n\nWe received a request to reset your password.\n\n[Reset Password]({{action_url}})\n\nThis link expires at {{expires_at}}. If you didn't request this, contact {{support_email}}.",
  },
  {
    slug: "auth.organization_invite",
    module: "Invitations/Auth",
    audience: "Invited owner/admin/manager/member/client",
    trigger: "Invite send or resend",
    variables: [
      "recipient_name",
      "org_name",
      "invite_role",
      "invited_by_name",
      "action_url",
      "expires_at",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "You're invited to join {{org_name}}",
    previewBody:
      "Hi {{recipient_name}},\n\n{{invited_by_name}} has invited you to join {{org_name}} as a {{invite_role}}.\n\n[Accept Invite]({{action_url}})\n\nThis invitation expires at {{expires_at}}.",
  },
  {
    slug: "auth.invite_expired",
    module: "Invitations/Auth",
    audience: "Invited user",
    trigger: "Invite token expired or invite marked expired",
    variables: [
      "recipient_name",
      "org_name",
      "request_new_invite_url",
      "support_email",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Your invitation to {{org_name}} has expired",
    previewBody:
      "Hi {{recipient_name}},\n\nYour invitation to join {{org_name}} has expired.\n\n[Request New Invite]({{request_new_invite_url}})\n\nNeed help? Contact {{support_email}}.",
  },
  {
    slug: "auth.invite_revoked",
    module: "Invitations/Auth",
    audience: "Invited user",
    trigger: "Pending invite revoked",
    variables: ["recipient_name", "org_name", "actor_name", "support_email"],
    priority: "P1",
    status: "Required",
    phase: 2,
    subject: "Your invitation to {{org_name}} was revoked",
    previewBody:
      "Hi {{recipient_name}},\n\nYour pending invitation to {{org_name}} has been revoked by {{actor_name}}.\n\nIf you believe this is an error, contact {{support_email}}.",
  },
  {
    slug: "auth.risky_sign_in_alert",
    module: "Security/Auth",
    audience: "All users",
    trigger: "Risky sign-in, unknown device, anomaly flag",
    variables: [
      "recipient_name",
      "device_name",
      "ip_address",
      "location",
      "timestamp",
      "security_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Unusual sign-in detected on your account",
    previewBody:
      "Hi {{recipient_name}},\n\nWe detected a sign-in from an unrecognized device.\n\nDevice: {{device_name}}\nIP: {{ip_address}}\nLocation: {{location}}\nTime: {{timestamp}}\n\nIf this wasn't you, [secure your account]({{security_url}}) immediately.",
  },
  {
    slug: "auth.membership_suspended",
    module: "Auth/Organization",
    audience: "Member or client",
    trigger: "Suspended membership blocks access",
    variables: [
      "recipient_name",
      "org_name",
      "actor_name",
      "reason",
      "support_email",
    ],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "Your access to {{org_name}} has been suspended",
    previewBody:
      "Hi {{recipient_name}},\n\nYour membership in {{org_name}} has been suspended by {{actor_name}}.\n\nReason: {{reason}}\n\nContact {{support_email}} if you need assistance.",
  },

  // === ACCESS ===
  {
    slug: "access.request_submitted",
    module: "Exception/Permissions",
    audience: "Owner/admin",
    trigger: "User hits /403 flow and requests access",
    variables: [
      "org_name",
      "requester_name",
      "requested_route",
      "current_role",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "Access request from {{requester_name}}",
    previewBody:
      "{{requester_name}} (current role: {{current_role}}) has requested access to {{requested_route}} in {{org_name}}.\n\n[Review Request]({{action_url}})",
  },

  // === ORGANIZATION ===
  {
    slug: "org.role_changed",
    module: "Team & Roles",
    audience: "Affected org member",
    trigger: "Role changed",
    variables: [
      "recipient_name",
      "org_name",
      "actor_name",
      "old_role",
      "new_role",
    ],
    priority: "P1",
    status: "Required",
    phase: 2,
    subject: "Your role in {{org_name}} has changed",
    previewBody:
      "Hi {{recipient_name}},\n\n{{actor_name}} has changed your role in {{org_name}} from {{old_role}} to {{new_role}}.\n\nYour permissions have been updated accordingly.",
  },
  {
    slug: "org.account_status_changed",
    module: "Team & Roles",
    audience: "Affected org member",
    trigger: "User suspended or reactivated",
    variables: ["recipient_name", "org_name", "actor_name", "status", "reason"],
    priority: "P1",
    status: "Required",
    phase: 2,
    subject: "Your account status in {{org_name}} has changed",
    previewBody:
      "Hi {{recipient_name}},\n\nYour account in {{org_name}} has been {{status}} by {{actor_name}}.\n\nReason: {{reason}}",
  },
  {
    slug: "org.ownership_transfer_notice",
    module: "Organization",
    audience: "Current owner and target owner",
    trigger: "Ownership transfer initiated or completed",
    variables: ["org_name", "old_owner_name", "new_owner_name", "timestamp"],
    priority: "P2",
    status: "Conditional",
    phase: 3,
    subject: "Ownership transfer for {{org_name}}",
    previewBody:
      "Ownership of {{org_name}} has been transferred from {{old_owner_name}} to {{new_owner_name}} on {{timestamp}}.",
  },

  // === INVITATIONS ===
  {
    slug: "invites.accepted_notice",
    module: "Invitations",
    audience: "Inviter plus owner/admin",
    trigger: "Invite accepted",
    variables: ["org_name", "accepted_user_name", "invite_role", "timestamp"],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "{{accepted_user_name}} joined {{org_name}}",
    previewBody:
      "{{accepted_user_name}} has accepted their invitation and joined {{org_name}} as a {{invite_role}} on {{timestamp}}.",
  },

  // === PROJECTS ===
  {
    slug: "projects.membership_changed",
    module: "Projects",
    audience: "Affected project member",
    trigger: "Added to or removed from project team",
    variables: ["recipient_name", "project_name", "actor_name", "status"],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "Project membership update: {{project_name}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} has {{status}} you on the project "{{project_name}}".',
  },

  // === TASKS ===
  {
    slug: "tasks.assignment_changed",
    module: "Tasks",
    audience: "Assignee and optionally reporter",
    trigger: "Assign, reassign, or unassign task",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "actor_name",
      "due_date",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Task assigned: {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} has assigned you to "{{task_title}}" in {{project_name}}.\n\nDue: {{due_date}}\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.status_changed",
    module: "Tasks",
    audience: "Assignee, reporter, watchers, shared client",
    trigger: "Task moved across statuses, blocked, completed, reopened",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "actor_name",
      "from_status",
      "to_status",
      "reason",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Task updated: {{task_title}} -> {{to_status}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} moved "{{task_title}}" in {{project_name}} from {{from_status}} to {{to_status}}.\n\n{{reason}}\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.mentioned",
    module: "Tasks",
    audience: "Mentioned member or client",
    trigger: "User mentioned in task comment or note",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "actor_name",
      "comment_snippet",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "{{actor_name}} mentioned you in {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} mentioned you in a comment on "{{task_title}}" ({{project_name}}):\n\n"{{comment_snippet}}"\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.comment_added",
    module: "Tasks",
    audience: "Assignee, reporter, watchers, shared client",
    trigger: "New comment on followed task without direct mention",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "actor_name",
      "comment_snippet",
    ],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "New comment on {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} commented on "{{task_title}}" in {{project_name}}:\n\n"{{comment_snippet}}"\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.due_soon",
    module: "Tasks",
    audience: "Assignee and optional manager",
    trigger: "Task due soon threshold reached",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "due_date",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Task due soon: {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n"{{task_title}}" in {{project_name}} is due on {{due_date}}.\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.overdue",
    module: "Tasks",
    audience: "Assignee, manager, optional reporter",
    trigger: "Task overdue",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "due_date",
      "days_overdue",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Task overdue: {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n"{{task_title}}" in {{project_name}} is {{days_overdue}} days overdue (due {{due_date}}).\n\n[View Task]({{task_url}})',
  },
  {
    slug: "tasks.attachment_added",
    module: "Tasks",
    audience: "Assignee, reporter, watchers, shared client",
    trigger: "Task image/file attachment uploaded",
    variables: [
      "recipient_name",
      "task_title",
      "project_name",
      "task_url",
      "attachment_name",
      "actor_name",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "New attachment on {{task_title}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} added "{{attachment_name}}" to "{{task_title}}" in {{project_name}}.\n\n[View Task]({{task_url}})',
  },

  // === FILES ===
  {
    slug: "files.shared_file_uploaded",
    module: "Files/Client Portal",
    audience: "Project members or client portal users",
    trigger: "Shared file uploaded outside a task-specific flow",
    variables: [
      "recipient_name",
      "project_name",
      "attachment_name",
      "file_url",
      "actor_name",
    ],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "New file shared in {{project_name}}",
    previewBody:
      'Hi {{recipient_name}},\n\n{{actor_name}} shared "{{attachment_name}}" in {{project_name}}.\n\n[View File]({{file_url}})',
  },

  // === PORTAL ===
  {
    slug: "portal.client_access_enabled",
    module: "Client Portal",
    audience: "Client user",
    trigger: "Client portal access granted first time",
    variables: ["recipient_name", "org_name", "action_url", "support_email"],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "Your client portal access for {{org_name}} is ready",
    previewBody:
      "Hi {{recipient_name}},\n\nYou now have access to the client portal for {{org_name}}.\n\n[Access Portal]({{action_url}})\n\nNeed help? Contact {{support_email}}.",
  },

  // === BILLING ===
  {
    slug: "billing.contact_owner_upgrade_request",
    module: "Plan Gating",
    audience: "Owner/admin",
    trigger: "Non-owner requests upgrade after hitting gate",
    variables: [
      "org_name",
      "requester_name",
      "requested_feature",
      "plan_name",
      "current_usage",
      "limit",
    ],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "Upgrade request from {{requester_name}}",
    previewBody:
      "{{requester_name}} in {{org_name}} tried to use {{requested_feature}} but hit the {{plan_name}} plan limit ({{current_usage}}/{{limit}}).\n\nConsider upgrading to unlock this feature.",
  },
  {
    slug: "billing.usage_limit_warning",
    module: "Billing/Plan Gating",
    audience: "Owner/admin",
    trigger: "Approaching quota threshold",
    variables: [
      "org_name",
      "feature_name",
      "current_usage",
      "limit",
      "plan_name",
      "action_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Usage warning: {{feature_name}} approaching limit",
    previewBody:
      "{{org_name}} is approaching the {{feature_name}} limit on the {{plan_name}} plan.\n\nCurrent usage: {{current_usage}} / {{limit}}\n\n[Manage Plan]({{action_url}})",
  },
  {
    slug: "billing.quota_limit_reached",
    module: "Billing/Plan Gating",
    audience: "Owner/admin and blocked requester",
    trigger: "Quota reached and action blocked",
    variables: [
      "org_name",
      "feature_name",
      "current_usage",
      "limit",
      "plan_name",
      "blocked_action",
      "action_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Quota reached: {{feature_name}}",
    previewBody:
      "{{org_name}} has reached the {{feature_name}} limit on the {{plan_name}} plan ({{current_usage}}/{{limit}}).\n\nBlocked action: {{blocked_action}}\n\n[Upgrade Plan]({{action_url}})",
  },
  {
    slug: "billing.subscription_changed",
    module: "Billing",
    audience: "Owner/admin",
    trigger: "Upgrade, downgrade, cancel at period end, resume",
    variables: [
      "org_name",
      "change_type",
      "old_plan",
      "new_plan",
      "timestamp",
      "action_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Subscription {{change_type}}: {{org_name}}",
    previewBody:
      "Your {{org_name}} subscription has been {{change_type}}.\n\nPrevious plan: {{old_plan}}\nNew plan: {{new_plan}}\nEffective: {{timestamp}}\n\n[View Billing]({{action_url}})",
  },
  {
    slug: "billing.invoice_available",
    module: "Billing",
    audience: "Owner/admin and client invoice audience",
    trigger: "Invoice issued and ready",
    variables: [
      "recipient_name",
      "org_name",
      "invoice_number",
      "invoice_url",
      "amount_due",
      "due_date",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Invoice #{{invoice_number}} - {{amount_due}} due {{due_date}}",
    previewBody:
      "Hi {{recipient_name}},\n\nInvoice #{{invoice_number}} for {{org_name}} is ready.\n\nAmount: {{amount_due}}\nDue: {{due_date}}\n\n[View Invoice]({{invoice_url}})",
  },
  {
    slug: "billing.payment_failed",
    module: "Billing",
    audience: "Owner/admin",
    trigger: "Payment attempt failed",
    variables: [
      "recipient_name",
      "org_name",
      "invoice_number",
      "amount_due",
      "failure_reason",
      "retry_payment_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Payment failed for invoice #{{invoice_number}}",
    previewBody:
      "Hi {{recipient_name}},\n\nPayment of {{amount_due}} for {{org_name}} (invoice #{{invoice_number}}) has failed.\n\nReason: {{failure_reason}}\n\n[Retry Payment]({{retry_payment_url}})",
  },
  {
    slug: "billing.invoice_past_due_reminder",
    module: "Billing",
    audience: "Owner/admin and optional shared invoice audience",
    trigger: "Invoice becomes past due",
    variables: [
      "recipient_name",
      "org_name",
      "invoice_number",
      "invoice_url",
      "amount_due",
      "due_date",
      "days_past_due",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Invoice #{{invoice_number}} is {{days_past_due}} days past due",
    previewBody:
      "Hi {{recipient_name}},\n\nInvoice #{{invoice_number}} for {{org_name}} is {{days_past_due}} days past due.\n\nAmount: {{amount_due}}\nOriginal due date: {{due_date}}\n\n[View Invoice]({{invoice_url}})",
  },
  {
    slug: "billing.payment_method_expiring",
    module: "Billing",
    audience: "Owner/admin",
    trigger: "Expiry warning threshold reached for payment method",
    variables: [
      "recipient_name",
      "org_name",
      "payment_method_brand",
      "last4",
      "exp_month",
      "exp_year",
      "action_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject:
      "Payment method expiring soon - {{payment_method_brand}} ****{{last4}}",
    previewBody:
      "Hi {{recipient_name}},\n\nYour {{payment_method_brand}} ending in {{last4}} for {{org_name}} expires {{exp_month}}/{{exp_year}}.\n\n[Update Payment Method]({{action_url}})",
  },
  {
    slug: "billing.payment_method_changed",
    module: "Billing",
    audience: "Owner/admin",
    trigger: "Payment method added, replaced, or removed",
    variables: [
      "recipient_name",
      "org_name",
      "payment_method_brand",
      "last4",
      "actor_name",
      "action_url",
    ],
    priority: "P1",
    status: "Recommended",
    phase: 2,
    subject: "Payment method updated for {{org_name}}",
    previewBody:
      "Hi {{recipient_name}},\n\n{{actor_name}} updated the payment method for {{org_name}} to {{payment_method_brand}} ending in {{last4}}.\n\n[View Billing]({{action_url}})",
  },

  // === SECURITY ===
  {
    slug: "security.session_action_notice",
    module: "Security",
    audience: "Affected user",
    trigger: "Session revoked or sign out all devices",
    variables: [
      "recipient_name",
      "action_type",
      "session_name",
      "device_name",
      "timestamp",
      "security_url",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "Security notice: {{action_type}}",
    previewBody:
      "Hi {{recipient_name}},\n\nA security action was performed on your account.\n\nAction: {{action_type}}\nSession: {{session_name}}\nDevice: {{device_name}}\nTime: {{timestamp}}\n\n[Review Security]({{security_url}})",
  },
  {
    slug: "security.forced_logout_due_to_policy",
    module: "Security",
    audience: "Affected user",
    trigger: "Forced logout caused by org or security policy",
    variables: [
      "recipient_name",
      "policy_name",
      "timestamp",
      "action_url",
      "support_email",
    ],
    priority: "P0",
    status: "Required",
    phase: 1,
    subject: "You were signed out due to a security policy",
    previewBody:
      'Hi {{recipient_name}},\n\nYou were signed out at {{timestamp}} due to the "{{policy_name}}" policy.\n\n[Sign Back In]({{action_url}})\n\nContact {{support_email}} for help.',
  },

  // === OPS ===
  {
    slug: "ops.data_export_ready",
    module: "Audit/Activity Logs",
    audience: "Owner/admin/export requester",
    trigger: "Async activity or audit export completed",
    variables: [
      "recipient_name",
      "export_type",
      "download_url",
      "expires_at",
      "timestamp",
    ],
    priority: "P1",
    status: "Required",
    phase: 2,
    subject: "Your {{export_type}} export is ready",
    previewBody:
      "Hi {{recipient_name}},\n\nYour {{export_type}} export is ready for download.\n\n[Download Export]({{download_url}})\n\nThis link expires at {{expires_at}}.",
  },
  {
    slug: "ops.event_ingestion_delay_alert",
    module: "Activity/Ops",
    audience: "Owner/admin/internal ops",
    trigger: "Event pipeline delay threshold breached",
    variables: [
      "org_name",
      "affected_stream",
      "delay_minutes",
      "timestamp",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "Event ingestion delay: {{affected_stream}}",
    previewBody:
      "Event ingestion for {{affected_stream}} in {{org_name}} is delayed by {{delay_minutes}} minutes as of {{timestamp}}.\n\n[View Status]({{action_url}})",
  },
  {
    slug: "ops.billing_webhook_processing_delay_alert",
    module: "Billing/Ops",
    audience: "Owner/admin/internal ops",
    trigger: "Billing webhook delivery or processing delay threshold breached",
    variables: [
      "org_name",
      "provider",
      "event_type",
      "delay_minutes",
      "timestamp",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "Billing webhook delay: {{provider}} - {{event_type}}",
    previewBody:
      "A billing webhook from {{provider}} ({{event_type}}) for {{org_name}} is delayed by {{delay_minutes}} minutes.\n\n[Investigate]({{action_url}})",
  },
  {
    slug: "ops.notification_delivery_failure_digest",
    module: "Notifications/Ops",
    audience: "Owner/admin/internal ops",
    trigger: "Notification delivery failures cross threshold",
    variables: [
      "org_name",
      "failed_channel",
      "failure_count",
      "last_error",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "Notification delivery failures: {{failed_channel}}",
    previewBody:
      "{{failure_count}} notification delivery failures on {{failed_channel}} for {{org_name}}.\n\nLast error: {{last_error}}\n\n[View Details]({{action_url}})",
  },
  {
    slug: "ops.webhook_endpoint_verification_failed",
    module: "Integrations",
    audience: "Owner/admin",
    trigger: "Webhook endpoint verification failed",
    variables: [
      "org_name",
      "integration_name",
      "endpoint_url",
      "failure_reason",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "Webhook verification failed: {{integration_name}}",
    previewBody:
      "Webhook endpoint verification for {{integration_name}} in {{org_name}} has failed.\n\nEndpoint: {{endpoint_url}}\nReason: {{failure_reason}}\n\n[Fix Configuration]({{action_url}})",
  },
  {
    slug: "ops.api_key_exposure_warning",
    module: "Integrations/Security",
    audience: "Owner/admin",
    trigger: "Suspicious API key exposure or admin security event",
    variables: [
      "org_name",
      "integration_name",
      "key_name",
      "timestamp",
      "action_url",
    ],
    priority: "P2",
    status: "Recommended",
    phase: 3,
    subject: "API key exposure warning: {{key_name}}",
    previewBody:
      "A potential API key exposure has been detected for {{key_name}} ({{integration_name}}) in {{org_name}} at {{timestamp}}.\n\n[Rotate Key]({{action_url}})",
  },
  {
    slug: "ops.rate_limit_abuse_block_alert",
    module: "Security/Ops",
    audience: "Owner/admin/internal ops",
    trigger: "Temporary abuse block or route throttling threshold reached",
    variables: [
      "org_name",
      "route_key",
      "block_scope",
      "expires_at",
      "timestamp",
      "action_url",
    ],
    priority: "P2",
    status: "Conditional",
    phase: 3,
    subject: "Rate limit block activated: {{route_key}}",
    previewBody:
      "A rate limit block has been activated for {{route_key}} in {{org_name}}.\n\nScope: {{block_scope}}\nExpires: {{expires_at}}\n\n[Review]({{action_url}})",
  },
];

// Group by category
export const categories: EmailCategory[] = [
  {
    id: "public-contact",
    label: "Public Contact",
    icon: "MessageSquare",
    description: "Contact form submissions and acknowledgments",
    templates: templates.filter((t) => t.slug.startsWith("public.")),
  },
  {
    id: "auth",
    label: "Authentication",
    icon: "Shield",
    description:
      "Verification, password reset, invitations, and sign-in alerts",
    templates: templates.filter((t) => t.slug.startsWith("auth.")),
  },
  {
    id: "access",
    label: "Access Requests",
    icon: "KeyRound",
    description: "Permission and access exception requests",
    templates: templates.filter((t) => t.slug.startsWith("access.")),
  },
  {
    id: "organization",
    label: "Organization",
    icon: "Building2",
    description: "Role changes, account status, and ownership transfers",
    templates: templates.filter((t) => t.slug.startsWith("org.")),
  },
  {
    id: "invitations",
    label: "Invitations",
    icon: "UserPlus",
    description: "Invite acceptance notifications",
    templates: templates.filter((t) => t.slug.startsWith("invites.")),
  },
  {
    id: "projects",
    label: "Projects",
    icon: "FolderKanban",
    description: "Project membership changes",
    templates: templates.filter((t) => t.slug.startsWith("projects.")),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "CheckSquare",
    description:
      "Assignments, status changes, mentions, comments, and deadlines",
    templates: templates.filter((t) => t.slug.startsWith("tasks.")),
  },
  {
    id: "files",
    label: "Files",
    icon: "FileUp",
    description: "Shared file upload notifications",
    templates: templates.filter((t) => t.slug.startsWith("files.")),
  },
  {
    id: "portal",
    label: "Client Portal",
    icon: "ExternalLink",
    description: "Client portal access notifications",
    templates: templates.filter((t) => t.slug.startsWith("portal.")),
  },
  {
    id: "billing",
    label: "Billing",
    icon: "CreditCard",
    description:
      "Invoices, payments, subscriptions, quotas, and payment methods",
    templates: templates.filter((t) => t.slug.startsWith("billing.")),
  },
  {
    id: "security",
    label: "Security",
    icon: "Lock",
    description: "Session actions and policy-enforced logouts",
    templates: templates.filter((t) => t.slug.startsWith("security.")),
  },
  {
    id: "ops",
    label: "Operations",
    icon: "Activity",
    description:
      "Data exports, pipeline alerts, webhook failures, and rate limits",
    templates: templates.filter((t) => t.slug.startsWith("ops.")),
  },
];

export default templates;

