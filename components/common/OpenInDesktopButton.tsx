"use client";

import { useElectron } from "@/hooks/use-electron";
import { safeInternalRedirect } from "@/lib/safe-redirect";

interface Props {
  /** Internal path to open in the desktop app, e.g. "/invoices/123" */
  path: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders a link that opens a specific path in the ClientFlow desktop app
 * via the clientflow:// deep-link protocol.
 *
 * Hidden when already running inside Electron (no need to "open in desktop"
 * if you're already there).
 */
export function OpenInDesktopButton({ path, className, children }: Props) {
  const electron = useElectron();

  // Already in the desktop app - don't show this button
  if (electron) return null;

  const safePath = safeInternalRedirect(path, "/");
  const deepLink = `clientflow://open?path=${encodeURIComponent(safePath)}`;

  return (
    <a href={deepLink} className={className}>
      {children ?? "Open in Desktop App"}
    </a>
  );
}
