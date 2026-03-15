export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "active" | "inactive" | "archived";
  projectCount: number;
  totalRevenue: string;
  lastActivity: string;
  avatarInitials: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  progress: number;
  startDate: string;
  dueDate: string;
  budget: string;
  teamCount: number;
  taskCount: number;
  completedTasks: number;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  status: "todo" | "in_progress" | "review" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: { name: string; initials: string };
  dueDate: string;
  estimate: string;
  tags: string[];
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member" | "client";
  status: "active" | "suspended" | "invited";
  initials: string;
  lastActive: string;
  projectCount: number;
}

export interface Notification {
  id: string;
  type:
    | "task_assigned"
    | "comment"
    | "status_change"
    | "mention"
    | "billing"
    | "invite";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: string;
  status: "paid" | "pending" | "overdue" | "draft";
  issuedDate: string;
  dueDate: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  actorInitials: string;
  action: string;
  target: string;
  timestamp: string;
  module: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}
