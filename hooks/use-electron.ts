"use client";

import { useEffect, useState } from "react";
import type { ElectronAPI } from "@/shared/electron-api";

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Returns the Electron API if the web app is running inside the desktop app,
 * or null when running in a normal browser.
 *
 * Use this to show/hide desktop-specific UI (e.g. "Open in Desktop" button).
 */
export function useElectron(): ElectronAPI | null {
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      setApi(window.electronAPI);
    }
  }, []);

  return api;
}
