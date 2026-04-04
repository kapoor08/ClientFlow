"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getUserInitials } from "@/core/auth";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Plans & Limits", href: "/admin/plans", icon: Zap },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Invitations", href: "/admin/invitations", icon: Mail },
  { label: "API Keys", href: "/admin/api-keys", icon: FileKey2 },
  { label: "Webhooks", href: "/admin/webhooks", icon: Webhook },
];

type Props = {
  user: { name: string; email: string };
  children: ReactNode;
};

export function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/auth/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center justify-center border-b border-sidebar-border",
            !collapsed && "px-2",
          )}
        >
          <Link href="/admin" className="flex items-center overflow-hidden">
            {collapsed ? (
              <Image
                src="/logo-app.png"
                alt="ClientFlow"
                width={32}
                height={32}
                className="h-10 w-10 shrink-0 object-contain"
              />
            ) : (
              <Image
                src="/app-logo.png"
                alt="ClientFlow"
                width={120}
                height={30}
                className="h-auto w-auto"
                priority
              />
            )}
          </Link>
        </div>

        {/* Nav */}
        <TooltipProvider delayDuration={200}>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              const link = (
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={href}>{link}</div>
              );
            })}
          </nav>
        </TooltipProvider>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 items-center justify-center border-t border-sidebar-border text-muted-foreground hover:bg-sidebar-accent/50 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end border-b border-border bg-card/80 px-6 backdrop-blur-lg">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {getUserInitials(user.name, user.email)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="leading-none">{user.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => void handleSignOut()}
              className="ml-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
