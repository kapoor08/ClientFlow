import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/auth";
import { getUserInitials } from "@/core/auth";
import SignOutButton from "@/components/auth/SignOutButton";
import AppSidebar from "./AppSidebar";

type AppShellProps = {
  children: ReactNode;
  user: User;
};

const AppShell = ({ children, user }: AppShellProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
              <Search size={14} />
              <span className="hidden sm:inline">Search... Ctrl+K</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </Button>
            <div className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {getUserInitials(user.name, user.email)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="leading-none">{user.name || "ClientFlow User"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
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
