"use client";

import { Monitor, Smartphone, Tablet, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRevokeSession,
  useRevokeAllSessions,
} from "@/core/security/useCase";
import type { SessionItem } from "@/core/security/entity";

// ─── User-agent helpers ───────────────────────────────────────────────────────

function parseDevice(ua: string | null): {
  label: string;
  Icon: typeof Monitor;
} {
  if (!ua) return { label: "Unknown device", Icon: Monitor };
  const u = ua.toLowerCase();
  if (u.includes("iphone") || u.includes("android") && u.includes("mobile")) {
    return { label: "Mobile", Icon: Smartphone };
  }
  if (u.includes("ipad") || u.includes("tablet")) {
    return { label: "Tablet", Icon: Tablet };
  }
  return { label: "Desktop", Icon: Monitor };
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown browser";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/") && ua.includes("Version/")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "Browser";
}

function parseOs(ua: string | null): string {
  if (!ua) return "";
  if (ua.includes("Windows NT 10")) return "Windows 10/11";
  if (ua.includes("Windows NT")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  return "";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ s }: { s: SessionItem }) {
  const { label, Icon } = parseDevice(s.userAgent);
  const browser = parseBrowser(s.userAgent);
  const os = parseOs(s.userAgent);
  const revoke = useRevokeSession();

  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-card p-4 shadow-cf-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
          <Icon size={20} className="text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {os ? `${label} · ${os}` : label}
            </p>
            {s.isCurrent && (
              <span className="rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {browser}
            {s.ipAddress ? ` · ${s.ipAddress}` : ""}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Last active {timeAgo(s.updatedAt)}
          </p>
        </div>
      </div>
      {!s.isCurrent && (
        <Button
          variant="outline"
          size="sm"
          disabled={revoke.isPending}
          onClick={() => revoke.mutate(
        { sessionId: s.id },
        {
          onSuccess: () => toast.success("Session revoked."),
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to revoke session."),
        },
      )}
          className="cursor-pointer"
        >
          {revoke.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <LogOut size={12} className="mr-1" />
          )}
          Revoke
        </Button>
      )}
    </div>
  );
}

// ─── Sessions section ─────────────────────────────────────────────────────────

type SessionsSectionProps = {
  sessions: SessionItem[];
  isLoading: boolean;
};

export function SessionsSection({ sessions, isLoading }: SessionsSectionProps) {
  const revokeAll = useRevokeAllSessions();
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Active Sessions
        </h2>
        {!isLoading && sessions.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="mb-8 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-4 shadow-cf-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="rounded-card border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-cf-1">
            No active sessions found.
          </div>
        ) : (
          sessions.map((s) => <SessionCard key={s.id} s={s} />)
        )}

        {otherSessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            disabled={revokeAll.isPending}
            onClick={() => revokeAll.mutate(undefined, {
              onSuccess: () => toast.success("All other sessions signed out."),
              onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to sign out sessions."),
            })}
            className="cursor-pointer"
          >
            {revokeAll.isPending ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <LogOut size={14} className="mr-1.5" />
            )}
            Sign Out All Other Devices
          </Button>
        )}
      </div>
    </>
  );
}
