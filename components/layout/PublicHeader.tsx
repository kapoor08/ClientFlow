"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { navLinks } from "@/config/navigation";
import { authRoutes, getUserInitials, useSignOut } from "@/core/auth";

type PublicHeaderViewer = {
  name: string;
  email: string;
  roleLabel: string;
  dashboardHref: string;
};

type PublicHeaderProps = {
  viewer?: PublicHeaderViewer | null;
};

const PublicHeader = ({ viewer = null }: PublicHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const signOut = useSignOut();

  async function handleSignOut() {
    try {
      await signOut.mutateAsync();
      router.push(authRoutes.signIn);
      router.refresh();
    } catch {
      router.push(authRoutes.signIn);
      router.refresh();
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b border-border/50 bg-background/95 backdrop-blur-lg",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/app-logo.png"
            alt="ClientFlow"
            width={130}
            height={28}
            className="h-auto w-auto dark:hidden"
            priority
          />
          <Image
            src="/app-logo.png"
            alt="ClientFlow"
            width={130}
            height={28}
            className="hidden h-7 w-auto dark:block"
            priority
          />
        </Link>

        <nav className="hidden items-center md:flex">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-1 py-1 border border-border/50 bg-secondary/80",
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {viewer ? (
          <div className="hidden items-center gap-3 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full border border-border/60 bg-secondary/60 px-3 py-1.5 text-left transition-colors hover:bg-secondary/80 cursor-pointer"
                  aria-label="Open account menu"
                  suppressHydrationWarning
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getUserInitials(viewer.name, viewer.email)}{" "}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {viewer.name}{" "}
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-[10px]"
                      >
                        {viewer.roleLabel}
                      </Badge>
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="max-w-40 truncate text-[11px] text-muted-foreground">
                        {viewer.email}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem
                  asChild
                  className="hover:bg-primary! hover:text-sidebar-background cursor-pointer"
                >
                  <Link href={viewer.dashboardHref}>
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleSignOut();
                  }}
                  disabled={signOut.isPending}
                  className="hover:bg-danger! hover:text-sidebar-background! text-error cursor-pointer"
                >
                  <LogOut size={16} />
                  {signOut.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/sign-in"
              className={cn(
                "text-[13px] font-medium transition-colors text-muted-foreground hover:text-foreground",
              )}
            >
              Sign In
            </Link>
            <Button
              size="sm"
              asChild
              className={cn("rounded-full px-5 text-[13px] font-semibold")}
            >
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        )}

        <button
          className={cn(
            "rounded-lg p-2 transition-colors md:hidden text-muted-foreground hover:bg-secondary cursor-pointer",
          )}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-300 md:hidden",
          mobileOpen
            ? "max-h-105 opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <div className="container flex flex-col gap-1 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {viewer ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {getUserInitials(viewer.name, viewer.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {viewer.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {viewer.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {viewer.roleLabel}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" asChild className="rounded-full cursor-pointer">
                  <Link
                    href={viewer.dashboardHref}
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard size={14} className="mr-1.5" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={() => void handleSignOut()}
                  disabled={signOut.isPending}
                >
                  <LogOut size={16} />
                  {signOut.isPending ? "Signing out..." : "Sign out"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                </Button>
                <Button size="lg" asChild className="rounded-full">
                  <Link
                    href="/auth/sign-up"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
