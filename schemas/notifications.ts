export type NotificationEventKey =
  // Clients
  | "client_created"
  | "client_status_changed"
  // Projects
  | "project_created"
  | "project_updated"
  | "project_status_changed"
  | "project_membership_changed"
  | "project_completed"
  // Tasks
  | "task_assigned"
  | "task_status_changed"
  | "task_comment_added"
  | "task_mentioned"
  | "task_due_soon"
  | "task_overdue"
  // Files
  | "shared_file_uploaded"
  | "file_deleted"
  // Team & Invitations
  | "invite_received"
  | "invite_accepted"
  | "invite_revoked"
  | "member_joined"
  | "role_changed"
  // Billing
  | "invoice_available"
  | "payment_failed"
  | "subscription_changed"
  | "payment_method_expiring"
  // Security
  | "risky_sign_in"
  | "account_status_changed";

export type NotificationEventCategory = {
  category: string;
  events: { key: NotificationEventKey; label: string; description: string }[];
};

export const NOTIFICATION_EVENT_CATEGORIES: NotificationEventCategory[] = [
  {
    category: "Clients",
    events: [
      {
        key: "client_created",
        label: "Client created",
        description: "When a new client is added to your organization",
      },
      {
        key: "client_status_changed",
        label: "Client status changed",
        description: "When a client's status is updated",
      },
    ],
  },
  {
    category: "Projects",
    events: [
      {
        key: "project_created",
        label: "Project created",
        description: "When a new project is created",
      },
      {
        key: "project_updated",
        label: "Project updated",
        description: "When a project's details are modified",
      },
      {
        key: "project_status_changed",
        label: "Project status changed",
        description: "When a project's status is updated",
      },
      {
        key: "project_membership_changed",
        label: "Project membership",
        description: "When you're added or removed from a project",
      },
      {
        key: "project_completed",
        label: "Project completed",
        description: "When a project is marked as completed",
      },
    ],
  },
  {
    category: "Tasks",
    events: [
      {
        key: "task_assigned",
        label: "Task assigned",
        description: "When a task is assigned to you",
      },
      {
        key: "task_status_changed",
        label: "Task status changed",
        description: "When a task you're on changes status",
      },
      {
        key: "task_comment_added",
        label: "New comment",
        description: "When someone comments on your task",
      },
      {
        key: "task_mentioned",
        label: "Mentioned",
        description: "When you're @mentioned in a task",
      },
      {
        key: "task_due_soon",
        label: "Due soon",
        description: "When a task is due within 24 hours",
      },
      {
        key: "task_overdue",
        label: "Overdue",
        description: "When a task passes its due date",
      },
    ],
  },
  {
    category: "Files",
    events: [
      {
        key: "shared_file_uploaded",
        label: "File uploaded",
        description: "When a file is uploaded to a project",
      },
      {
        key: "file_deleted",
        label: "File deleted",
        description: "When a file is deleted from a project",
      },
    ],
  },
  {
    category: "Team & Invitations",
    events: [
      {
        key: "invite_received",
        label: "Invitation received",
        description: "When you receive an invitation to join an organization",
      },
      {
        key: "invite_accepted",
        label: "Invitation accepted",
        description: "When someone accepts your invitation",
      },
      {
        key: "invite_revoked",
        label: "Invitation revoked",
        description: "When an invitation you sent is revoked",
      },
      {
        key: "member_joined",
        label: "Member joined",
        description: "When a new member joins your organization",
      },
      {
        key: "role_changed",
        label: "Role changed",
        description: "When your organization role is updated",
      },
    ],
  },
  {
    category: "Billing",
    events: [
      {
        key: "invoice_available",
        label: "Invoice available",
        description: "When a new invoice is ready to view",
      },
      {
        key: "payment_failed",
        label: "Payment failed",
        description: "When a payment attempt fails",
      },
      {
        key: "subscription_changed",
        label: "Subscription changed",
        description: "When your plan or subscription is updated",
      },
      {
        key: "payment_method_expiring",
        label: "Payment method expiring",
        description: "When a saved payment method is about to expire",
      },
    ],
  },
  {
    category: "Security",
    events: [
      {
        key: "risky_sign_in",
        label: "Suspicious sign-in",
        description: "When a sign-in from an unrecognized device is detected",
      },
      {
        key: "account_status_changed",
        label: "Account status changed",
        description: "When your account status is updated",
      },
    ],
  },
];

export const ALL_EVENT_KEYS: NotificationEventKey[] =
  NOTIFICATION_EVENT_CATEGORIES.flatMap((c) => c.events.map((e) => e.key));

export type NotificationPreference = {
  eventKey: NotificationEventKey;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};
