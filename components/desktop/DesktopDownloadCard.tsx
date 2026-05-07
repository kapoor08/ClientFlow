"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Apple, Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { desktopConfig, type DesktopOS, osLabels } from "@/config/desktop";
import { captureClientEvent } from "@/lib/analytics/client";
import { DESKTOP_EVENTS } from "@/lib/analytics/events";

function trackDownload(os: DesktopOS | "all", source: "primary" | "secondary" | "releases") {
  captureClientEvent(DESKTOP_EVENTS.downloadClicked, { os, source });
}

function detectOS(): DesktopOS | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  if (platform.includes("mac") || ua.includes("mac os")) return "mac";
  if (platform.includes("win") || ua.includes("windows")) return "win";
  if (platform.includes("linux") || ua.includes("linux")) return "linux";
  return null;
}

const OS_ICON: Record<DesktopOS, React.ComponentType<{ size?: number; className?: string }>> = {
  win: Monitor,
  mac: Apple,
  linux: Monitor,
};

const OS_ORDER: DesktopOS[] = ["win", "mac", "linux"];

export default function DesktopDownloadCard() {
  const [detected, setDetected] = useState<DesktopOS | null>(null);

  useEffect(() => {
    setDetected(detectOS());
  }, []);

  // Render the detected OS as the primary CTA; fall back to a neutral
  // "All downloads" button while detection runs (avoids hydration flicker
  // between server placeholder and client-detected platform).
  const primary = detected;
  const others = OS_ORDER.filter((os) => os !== primary);

  return (
    <div className="flex flex-col items-center gap-4">
      {primary ? (
        <Button size="lg" asChild className="rounded-full px-7">
          <Link
            href={desktopConfig.downloads[primary]}
            onClick={() => trackDownload(primary, "primary")}
          >
            <Download size={16} className="mr-2" />
            Download for {osLabels[primary]}
          </Link>
        </Button>
      ) : (
        <Button size="lg" asChild className="rounded-full px-7">
          <Link href={desktopConfig.releasesUrl} onClick={() => trackDownload("all", "primary")}>
            <Download size={16} className="mr-2" />
            Download ClientFlow Desktop
          </Link>
        </Button>
      )}

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-xs">
        {others.map((os) => {
          const Icon = OS_ICON[os];
          return (
            <Link
              key={os}
              href={desktopConfig.downloads[os]}
              onClick={() => trackDownload(os, "secondary")}
              className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors"
            >
              <Icon size={12} />
              {osLabels[os]}
            </Link>
          );
        })}
        <Link
          href={desktopConfig.releasesUrl}
          onClick={() => trackDownload("all", "releases")}
          className="ml-1 underline-offset-2 hover:underline"
        >
          All releases
        </Link>
      </div>
    </div>
  );
}
