"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_NAV_GROUPS } from "./data";

type HeroSidebarProps = {
  activePage: string;
  onNavigate: (href: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function HeroSidebar({ activePage, onNavigate, collapsed, onToggleCollapse }: HeroSidebarProps) {
  return (
    <aside
      className="flex shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200"
      style={{ width: collapsed ? 48 : 170 }}
    >
      {/* Logo */}
      <div className="flex h-11 items-center border-b border-border px-3">
        {collapsed ? (
          <Image src="/app-logo.png" alt="ClientFlow" width={28} height={28} className="shrink-0 object-contain" />
        ) : (
          <Image src="/app-logo.png" alt="ClientFlow" width={110} height={28} className="object-contain" />
        )}
      </div>

      {/* Navigation groups */}
      <nav className="hero-preview-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {HERO_NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-2.5" : ""}>
            {!collapsed && (
              <p className="mb-1 px-2 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && <div className="mx-1 my-2 h-px bg-border/50" />}
            <div className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, href }) => {
                const isActive = activePage === href;
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => onNavigate(href)}
                    title={collapsed ? label : undefined}
                    className={`flex w-full items-center rounded-lg transition-colors cursor-pointer ${
                      collapsed ? "justify-center px-1 py-2" : "gap-2.5 px-2.5 py-2"
                    } ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon size={collapsed ? 16 : 15} className="shrink-0" />
                    {!collapsed && <span className="text-[11px] font-medium">{label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="flex items-center justify-center border-t border-border py-2.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground/50 hover:bg-secondary hover:text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
