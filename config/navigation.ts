import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

export const navGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    label: "Work Management",
    items: [
      { icon: Users, label: "Clients", href: "/clients" },
      { icon: FolderKanban, label: "Projects", href: "/projects" },
      { icon: CheckSquare, label: "Tasks", href: "/tasks" },
      { icon: FileText, label: "Files", href: "/files" },
      { icon: Activity, label: "Activity Logs", href: "/activity-logs" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Bell, label: "Notifications", href: "/notifications" },
      { icon: UserPlus, label: "Invitations", href: "/invitations" },
    ],
  },
  {
    label: "Business",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/analytics" },
      { icon: CreditCard, label: "Billing", href: "/billing" },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        icon: Settings,
        label: "Organization",
        href: "/settings",
      },
      { icon: Users, label: "Team & Roles", href: "/teams" },
      { icon: BookOpen, label: "Audit Logs", href: "/audit-logs" },
      { icon: Shield, label: "Security", href: "/org-security" },
    ],
  },
];

export const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Integrations", href: "/integrations" },
  { label: "About", href: "/about" },
];
