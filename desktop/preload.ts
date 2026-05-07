import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "../shared/electron-api";

/**
 * Exposes a minimal, safe API surface to the renderer (the Next.js web app).
 * Nothing from Node.js or Electron's full API is exposed - only these methods.
 *
 * The shape MUST satisfy the ElectronAPI contract in shared/electron-api.ts;
 * the renderer types window.electronAPI from the same file.
 */
const api: ElectronAPI = {
  platform: process.platform as ElectronAPI["platform"],
  isDesktop: true,
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  startDesktopLogin: () => ipcRenderer.invoke("start-desktop-login"),
};

contextBridge.exposeInMainWorld("electronAPI", api);
