import {
  Activity,
  BarChart3,
  Bell,
  CheckSquare,
  Clock,
  Code2,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

export const navGroups = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Work Management",
    items: [
      { icon: Users, label: "Clients", href: "/clients" },
      { icon: FolderKanban, label: "Projects", href: "/projects" },
      { icon: CheckSquare, label: "Tasks", href: "/tasks" },
      { icon: Clock, label: "Time Tracking", href: "/time-tracking" },
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
      { icon: Receipt, label: "Invoices", href: "/invoices" },
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
      { icon: Shield, label: "Security", href: "/org-security" },
      { icon: Code2, label: "Developer", href: "/developer" },
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
