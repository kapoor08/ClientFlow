"use client";

import Link from "next/link";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { captureClientEvent } from "@/lib/analytics/client";
import { DESKTOP_EVENTS } from "@/lib/analytics/events";

const DISMISS_KEY = "cf:desktop-banner-dismissed";

/**
 * Lightweight banner shown inside the protected app shell, advertising the
 * desktop build to web users. Hidden when:
 *   - already running inside Electron (window.electronAPI is set)
 *   - the user has previously dismissed it (localStorage flag)
 *
 * The mount delay until the first effect prevents flash on the desktop app.
 */
export function DesktopAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.electronAPI) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
    captureClientEvent(DESKTOP_EVENTS.bannerShown);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    captureClientEvent(DESKTOP_EVENTS.bannerDismissed);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage may be unavailable (private mode, quota); silent ignore is
      // fine - the banner just reappears next session.
    }
  };

  return (
    <div className="border-primary/20 bg-primary/5 text-primary flex items-center justify-between gap-3 border-b px-4 py-2 text-xs font-medium">
      <div className="flex items-center gap-2">
        <Download size={13} className="shrink-0" />
        <span>
          ClientFlow runs faster as a desktop app.{" "}
          <Link
            href="/desktop"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            Get it for Mac, Windows, or Linux
          </Link>
          .
        </span>
      </div>
      <button
        onClick={dismiss}
        className="hover:bg-primary/10 shrink-0 cursor-pointer rounded p-0.5"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default DesktopAppBanner;
