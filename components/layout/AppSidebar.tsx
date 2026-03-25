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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AppSidebar = ({ planCode }: { planCode: string }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Filter groups to only include items accessible on this plan
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessHref(planCode, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  // Items locked on this plan (shown greyed out with lock icon)
  const lockedItems = navGroups
    .flatMap((g) => g.items)
    .filter((item) => !canAccessHref(planCode, item.href));

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-2">
        <Link href="/" className="flex items-center overflow-hidden">
          {collapsed ? (
            <Image
              src="/favicon.png"
              alt="ClientFlow"
              width={32}
              height={32}
              className="h-9 w-9 shrink-0"
            />
          ) : (
            <>
              <Image
                src="/logo.png"
                alt="ClientFlow"
                width={130}
                height={28}
                className="h-auto w-auto dark:hidden"
                priority
              />
              <Image
                src="/logo.png"
                alt="ClientFlow"
                width={130}
                height={28}
                className="hidden h-auto w-auto dark:block"
                priority
              />
            </>
          )}
        </Link>
      </div>

      <TooltipProvider delayDuration={200}>
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Accessible modules */}
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
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.href}>{link}</div>
                );
              })}
            </div>
          ))}

          {/* Locked modules — expanded */}
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

          {/* Locked modules — collapsed */}
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
        </nav>
      </TooltipProvider>

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
