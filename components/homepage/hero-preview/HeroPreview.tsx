"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeroSidebar } from "./HeroSidebar";
import { HeroNavbar } from "./HeroNavbar";
import { HeroSearchModal } from "./HeroSearchModal";
import { HeroNotificationPopover } from "./HeroNotificationPopover";
import { HeroDashboardPage } from "./pages/HeroDashboardPage";
import { HeroClientsPage } from "./pages/HeroClientsPage";
import { HeroProjectsPage } from "./pages/HeroProjectsPage";
import { HeroTasksPage } from "./pages/HeroTasksPage";
import { HeroInvoicesPage } from "./pages/HeroInvoicesPage";
import { HeroAnalyticsPage } from "./pages/HeroAnalyticsPage";
import { HeroNotificationsPage } from "./pages/HeroNotificationsPage";
import { HeroFilesPage } from "./pages/HeroFilesPage";
import { HeroActivityLogsPage } from "./pages/HeroActivityLogsPage";
import { HeroInvitationsPage } from "./pages/HeroInvitationsPage";
import { HeroBillingPage } from "./pages/HeroBillingPage";
import { HeroOrganizationPage } from "./pages/HeroOrganizationPage";
import { HeroTeamPage } from "./pages/HeroTeamPage";
import { HeroSecurityPage } from "./pages/HeroSecurityPage";
import { HeroDeveloperPage } from "./pages/HeroDeveloperPage";
import { HeroPlaceholderPage } from "./pages/HeroPlaceholderPage";
import { HERO_NOTIFICATIONS } from "./data";

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  "/dashboard": HeroDashboardPage,
  "/clients": HeroClientsPage,
  "/projects": HeroProjectsPage,
  "/tasks": HeroTasksPage,
  "/files": HeroFilesPage,
  "/activity-logs": HeroActivityLogsPage,
  "/notifications": HeroNotificationsPage,
  "/invitations": HeroInvitationsPage,
  "/analytics": HeroAnalyticsPage,
  "/invoices": HeroInvoicesPage,
  "/billing": HeroBillingPage,
  "/settings": HeroOrganizationPage,
  "/teams": HeroTeamPage,
  "/org-security": HeroSecurityPage,
  "/developer": HeroDeveloperPage,
};

export default function HeroPreview() {
  const [activePage, setActivePage] = useState("/dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const unreadCount = HERO_NOTIFICATIONS.filter((n) => n.unread).length;

  const handleNavigate = useCallback((href: string) => {
    setActivePage(href);
    setSearchOpen(false);
    setNotificationOpen(false);
  }, []);

  const handleSearchClick = useCallback(() => {
    setNotificationOpen(false);
    setSearchOpen(true);
  }, []);

  const handleNotificationClick = useCallback(() => {
    setSearchOpen(false);
    setNotificationOpen((prev) => !prev);
  }, []);

  const PageComponent = PAGE_COMPONENTS[activePage];

  return (
    <div className="mockup-frame overflow-hidden">
      {/* Browser chrome */}
      <div className="mockup-dots">
        <span />
        <span />
        <span />
        <div className="ml-3 flex h-5 flex-1 items-center rounded-full bg-secondary px-3">
          <div className="h-1.5 w-24 rounded-full bg-border" />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-4 w-14 rounded bg-secondary" />
          <div className="h-4 w-10 rounded bg-secondary" />
        </div>
      </div>

      {/* App shell - increased height */}
      <div className="relative flex h-[420px] md:h-[520px] lg:h-[580px]">
        <HeroSidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        />

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <HeroNavbar
            onSearchClick={handleSearchClick}
            onNotificationClick={handleNotificationClick}
            notificationOpen={notificationOpen}
            unreadCount={unreadCount}
          />

          {/* Page content with transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              {PageComponent ? (
                <PageComponent />
              ) : (
                <HeroPlaceholderPage href={activePage} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overlays */}
        <HeroSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={handleNavigate}
        />
        <HeroNotificationPopover
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
      </div>
    </div>
  );
}
