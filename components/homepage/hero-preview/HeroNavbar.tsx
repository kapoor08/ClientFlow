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
    <div className="border-border bg-card/80 flex h-11 shrink-0 items-center justify-between border-b px-5">
      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchClick}
        className="border-border bg-secondary hover:bg-secondary/70 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-colors"
      >
        <Search size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground/60 text-[11px]">Search...</span>
        <span className="border-border bg-background text-muted-foreground/50 ml-4 rounded border px-1.5 py-0.5 text-[9px]">
          Ctrl+K
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          onClick={onNotificationClick}
          className="text-muted-foreground hover:text-foreground relative flex cursor-pointer items-center justify-center transition-colors"
        >
          <Bell size={15} className={notificationOpen ? "text-primary" : ""} />
          {unreadCount > 0 && (
            <span className="bg-primary! text-accent-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar + info */}
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold">
            LK
          </div>
          <div className="hidden min-[900px]:block">
            <div className="text-foreground text-[11px] leading-tight font-semibold">
              Lakshay Kapoor
            </div>
            <div className="text-muted-foreground text-[9px] leading-tight">
              kapoorlakshay2002@gmail.com
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="text-muted-foreground/60 flex items-center gap-1">
          <LogOut size={11} />
          <span className="hidden text-[10px] min-[900px]:inline">Sign out</span>
        </div>
      </div>
    </div>
  );
}
