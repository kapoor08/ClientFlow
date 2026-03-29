"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "@/config/navigation";
import { canAccessHref } from "@/config/plan-limits";
import {
  isNavHrefVisibleForMember,
  getVisiblePortalHrefs,
  type RolePermissionsConfig,
  type MemberPermissionOverrides,
} from "@/config/role-permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Portal nav items ───────────────────────────────────────────────────────────
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileText,
  Receipt,
} from "lucide-react";

const ALL_PORTAL_NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/client-portal" },
  { icon: FolderKanban, label: "Projects", href: "/client-portal/projects" },
  { icon: CheckSquare, label: "Tasks", href: "/client-portal/tasks" },
  { icon: FileText, label: "Files", href: "/client-portal/files" },
  { icon: Receipt, label: "Invoices", href: "/client-portal/invoices" },
];

// ── Types ──────────────────────────────────────────────────────────────────────
type AppSidebarProps =
  | {
      mode: "admin";
      planCode: string;
      roleKey?: string | null;
      logoUrl?: string | null;
      orgName?: string | null;
      brandColor?: string | null;
      rolePermissions?: RolePermissionsConfig | null;
      memberPermissionOverrides?: MemberPermissionOverrides | null;
    }
  | {
      mode: "portal";
      logoUrl?: string | null;
      orgName?: string | null;
      brandColor?: string | null;
      rolePermissions?: RolePermissionsConfig | null;
      memberPermissionOverrides?: MemberPermissionOverrides | null;
    };

// ── Component ──────────────────────────────────────────────────────────────────
const AppSidebar = (props: AppSidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isPortal = props.mode === "portal";
  const brandColor =
    (props as { brandColor?: string | null }).brandColor ?? null;
  const orgName = (props as { orgName?: string | null }).orgName ?? null;
  const logoUrl = (props as { logoUrl?: string | null }).logoUrl ?? null;
  const planCode = !isPortal
    ? (props as { planCode: string }).planCode
    : "professional";
  const roleKey = !isPortal
    ? (props as { roleKey?: string | null }).roleKey
    : null;
  const rolePermissions = props.rolePermissions ?? null;
  const memberPermissionOverrides = props.memberPermissionOverrides ?? null;

  // Admin: group-aware + plan gating + role + member-level permissions
  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          canAccessHref(planCode, i.href) &&
          isNavHrefVisibleForMember(
            i.href,
            roleKey,
            rolePermissions,
            memberPermissionOverrides,
          ),
      ),
    }))
    .filter((g) => g.items.length > 0);
  const lockedItems = navGroups
    .flatMap((g) => g.items)
    .filter((i) => !canAccessHref(planCode, i.href));

  // Portal: filter by client role permissions + member overrides
  const visiblePortalHrefs = getVisiblePortalHrefs(
    rolePermissions,
    memberPermissionOverrides,
  );
  const portalNavItems = ALL_PORTAL_NAV_ITEMS.filter(
    (i) => i.href === "/client-portal" || visiblePortalHrefs.has(i.href),
  );

  // Active style helpers
  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname?.startsWith(href);
  }
  function activeClassName(active: boolean) {
    if (active && brandColor) return ""; // handled via inline style
    return cn(
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
      collapsed && "justify-center",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
    );
  }
  const activeStyle = (active: boolean) =>
    active && brandColor
      ? { color: brandColor, backgroundColor: `${brandColor}18` }
      : undefined;

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* ── Logo ── */}
      <div className={cn("flex h-16 items-center justify-center border-b border-sidebar-border", !collapsed && "px-2")}>
        <Link
          href={isPortal ? "/client-portal" : "/"}
          className="flex items-center overflow-hidden"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={orgName ?? "Logo"}
              className={
                collapsed
                  ? "h-9 w-9 shrink-0 object-contain"
                  : "h-9 max-w-32.5 object-contain"
              }
            />
          ) : collapsed ? (
            <Image
              src="/favicon.png"
              alt="ClientFlow"
              width={32}
              height={32}
              className="h-10 w-10 shrink-0 object-contain"
            />
          ) : (
            <Image
              src="/app-logo.png"
              alt="ClientFlow"
              width={130}
              height={28}
              className="h-auto w-auto"
              priority
            />
          )}
        </Link>
      </div>

      {/* ── Portal workspace label ── */}
      {isPortal && !collapsed && (
        <div className="border-b border-sidebar-border px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {orgName ? `${orgName} Portal` : "Client Portal"}
          </span>
        </div>
      )}

      <TooltipProvider delayDuration={200}>
        <nav className="flex-1 overflow-y-auto p-3">
          {/* ── Portal: flat nav ── */}
          {isPortal && (
            <div className="space-y-0.5">
              {portalNavItems.map((item) => {
                const active =
                  item.href === "/client-portal"
                    ? pathname === "/client-portal"
                    : pathname?.startsWith(item.href);

                const link = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center",
                      !brandColor &&
                        active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                      !brandColor &&
                        !active &&
                        "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      brandColor &&
                        !active &&
                        "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                    style={activeStyle(active)}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.href}>{link}</div>
                );
              })}
            </div>
          )}

          {/* ── Admin: grouped nav + plan gating ── */}
          {!isPortal && (
            <>
              {visibleGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  {!collapsed && (
                    <span className="mb-1 block px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                  )}
                  {group.items.map((item) => {
                    const active = pathname?.startsWith(item.href);
                    const link = (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          collapsed && "justify-center",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon size={18} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );

                    return collapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={item.href}>{link}</div>
                    );
                  })}
                </div>
              ))}

              {/* Locked items */}
              {lockedItems.length > 0 && !collapsed && (
                <div className="mb-4">
                  <span className="mb-1 block px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Upgrade to unlock
                  </span>
                  {lockedItems.map((item) => (
                    <Link
                      key={item.href}
                      href="/plans"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/30 hover:bg-sidebar-accent/20 transition-colors"
                    >
                      <item.icon size={18} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Lock size={12} className="shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {lockedItems.length > 0 && collapsed && (
                <div className="mb-4">
                  {lockedItems.map((item) => (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href="/plans"
                          className="flex items-center justify-center rounded-lg px-2.5 py-2 text-sidebar-foreground/30 hover:bg-sidebar-accent/20 transition-colors"
                        >
                          <item.icon size={18} className="shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label} — upgrade to unlock
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>
      </TooltipProvider>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-sidebar-border text-muted-foreground hover:bg-sidebar-accent/50 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};

export default AppSidebar;
