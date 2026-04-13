import type React from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Zap,
  FileKey2,
  Webhook,
  ClipboardList,
  BarChart3,
  Mail,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Plans & Limits", href: "/admin/plans", icon: Zap },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Contact Forms", href: "/admin/contact-submissions", icon: MessageSquare },
  { label: "Invitations", href: "/admin/invitations", icon: Mail },
  { label: "API Keys", href: "/admin/api-keys", icon: FileKey2 },
  { label: "Webhooks", href: "/admin/webhooks", icon: Webhook },
];
