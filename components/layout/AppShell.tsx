import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import type { User } from "@/lib/auth";
import { getUserInitials } from "@/core/auth";
import SignOutButton from "@/components/auth/SignOutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import AppSidebar from "./AppSidebar";

type AppShellProps = {
  children: ReactNode;
  user: User;
};

const AppShell = ({ children, user }: AppShellProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="flex w-52 items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search size={14} />
                <span className="hidden sm:inline">Search...</span>
              </div>
              <Kbd className="hidden bg-background border border-cf-neutral-500 px-2 py-2! sm:inline-flex">
                Ctrl+K
              </Kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {getUserInitials(user.name, user.email)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="leading-none">{user.name || "ClientFlow User"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
