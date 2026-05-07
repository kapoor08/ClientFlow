/**
 * Single source of truth for the bridge between the Electron preload and the
 * web app's renderer. Both sides MUST import this type:
 *
 *   - desktop/preload.ts implements it via contextBridge.exposeInMainWorld
 *   - hooks/use-electron.ts uses it to type window.electronAPI
 *
 * Keeping the contract here prevents drift across the IPC boundary.
 */
export interface ElectronAPI {
  /** The current OS platform. */
  platform: "darwin" | "win32" | "linux";

  /** Marker so the web app can branch its UI when running inside Electron. */
  isDesktop: true;

  /** Opens a URL in the system's default browser (not in Electron). */
  openExternal: (url: string) => Promise<void>;

  /**
   * Kicks off the desktop sign-in flow: opens /desktop/login in the user's
   * system browser so Google OAuth runs in a non-embedded user agent. The
   * returned promise resolves once Electron has handed the URL to the OS;
   * the actual sign-in completes asynchronously and returns via the
   * clientflow:// deep link.
   */
  startDesktopLogin: () => Promise<void>;
}
