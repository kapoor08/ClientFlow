"use client";

import { Bell, LogOut, Search } from "lucide-react";

type HeroNavbarProps = {
  onSearchClick: () => void;
  onNotificationClick: () => void;
  notificationOpen: boolean;
  unreadCount: number;
};

export function HeroNavbar({
  onSearchClick,
  onNotificationClick,
  notificationOpen,
  unreadCount,
}: HeroNavbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/80 px-5">
      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchClick}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-secondary px-3 py-1.5 transition-colors hover:bg-secondary/70"
      >
        <Search size={12} className="text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground/60">Search...</span>
        <span className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground/50">
          Ctrl+K
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          onClick={onNotificationClick}
          className="relative flex cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell size={15} className={notificationOpen ? "text-primary" : ""} />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar + info */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            LK
          </div>
          <div className="hidden min-[900px]:block">
            <div className="text-[11px] font-semibold text-foreground leading-tight">Lakshay Kapoor</div>
            <div className="text-[9px] text-muted-foreground leading-tight">kapoorlakshay2002@gmail.com</div>
          </div>
        </div>

        {/* Sign out */}
        <div className="flex items-center gap-1 text-muted-foreground/60">
          <LogOut size={11} />
          <span className="hidden text-[10px] min-[900px]:inline">Sign out</span>
        </div>
      </div>
    </div>
  );
}
