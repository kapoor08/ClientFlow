"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Palette, Key, HardDrive, Webhook, ShieldCheck, ShieldUser } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/settings", label: "Organization", icon: Building2, exact: true },
  { href: "/settings/branding", label: "Branding", icon: Palette, exact: false },
  { href: "/settings/roles", label: "Role Permissions", icon: ShieldUser, exact: false },
  { href: "/settings/api-keys", label: "API Keys", icon: Key, exact: false },
  { href: "/settings/data", label: "Data Export", icon: HardDrive, exact: false },
  { href: "/settings/webhooks", label: "Webhooks", icon: Webhook, exact: false },
  { href: "/settings/sso", label: "SSO", icon: ShieldCheck, exact: false },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-8">
      {/* Sidebar nav */}
      <nav className="hidden w-48 shrink-0 md:block">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
        <ul className="space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon size={15} className="shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/50 p-1 md:hidden">
        {SETTINGS_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon size={13} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
