import { app, BrowserWindow, shell, ipcMain, nativeTheme } from "electron";
import * as path from "node:path";
import * as crypto from "node:crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const PROTOCOL = "clientflow";
const isDev = process.env.ELECTRON_ENV === "development";
const WEB_URL = isDev ? "http://localhost:3000" : "https://client-flow.in";

/**
 * Per-launch nonce. Bound to the exchange token minted during desktop sign-in
 * so a leaked redirect URL can't be redeemed from a different Electron
 * instance. Regenerated each cold start - if the user closes the app
 * mid-flow the deep-link return will fail safely with "please retry".
 */
const desktopNonce = crypto.randomBytes(16).toString("hex");

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;

function createWindow(initialPath = "/") {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0a0a0a" : "#ffffff",
    show: false,
  });

  void mainWindow.loadURL(`${WEB_URL}${initialPath}`);

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow?.show();
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
  }, 3000);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(WEB_URL)) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(WEB_URL)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // Cover server-side redirects too. will-navigate doesn't fire when the
  // server returns a 3xx mid-flow (e.g. Better Auth -> Google), so a Google
  // OAuth URL would otherwise load inside the BrowserWindow and trip the
  // disallowed-user-agent block.
  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (!url.startsWith(WEB_URL)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Deep Linking ─────────────────────────────────────────────────────────────

function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1]!)]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[a-f0-9]{16,128}$/;

/**
 * Parses a deep-link URL and routes the main window accordingly.
 *
 * Supported formats:
 *   clientflow://open?path=/dashboard          - generic navigation
 *   clientflow://auth?token=T&nonce=N          - sign-in hand-off from web
 */
function handleDeepLink(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return navigateToWindow("/");
  }

  if (parsed.host === "auth") {
    handleAuthExchange(parsed);
    return;
  }

  const targetPath = safeInternalPath(parsed.searchParams.get("path") || "/");
  navigateToWindow(targetPath);
}

function handleAuthExchange(parsed: URL) {
  const token = parsed.searchParams.get("token") || "";
  const nonce = parsed.searchParams.get("nonce") || "";

  if (!TOKEN_PATTERN.test(token) || !NONCE_PATTERN.test(nonce)) {
    console.warn("[desktop-auth] malformed exchange URL");
    return navigateToWindow("/auth/sign-in");
  }

  if (nonce !== desktopNonce) {
    // Most likely cause: this Electron instance restarted after the user
    // started the sign-in flow in their browser. The token is now bound to
    // a defunct nonce and can't be redeemed. Send them back to sign-in.
    console.warn("[desktop-auth] nonce mismatch - likely a restart mid-flow");
    return navigateToWindow("/auth/sign-in?reason=desktop_handoff_expired");
  }

  const dest = `/desktop/exchange?token=${encodeURIComponent(
    token,
  )}&nonce=${encodeURIComponent(nonce)}`;
  navigateToWindow(dest);
}

function navigateToWindow(internalPath: string) {
  if (mainWindow) {
    void mainWindow.loadURL(`${WEB_URL}${internalPath}`);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    createWindow(internalPath);
  }
}

function safeInternalPath(value: string) {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.startsWith("/\\")) return "/";
  if (value.includes("\\")) return "/";
  return value;
}

// ─── Single Instance Lock (Windows / Linux) ───────────────────────────────────

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLinkArg = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLinkArg) {
      handleDeepLink(deepLinkArg);
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── macOS Deep Link ──────────────────────────────────────────────────────────

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// ─── IPC ──────────────────────────────────────────────────────────────────────

ipcMain.handle("open-external", (_event, url: string) => {
  if (/^https?:\/\//.test(url) || /^mailto:/.test(url)) {
    void shell.openExternal(url);
  }
});

/**
 * Launches the desktop sign-in flow. Renderer (the web app, when it detects
 * window.electronAPI) calls this from the "Sign in with Google" handler so
 * Google OAuth happens in the user's real browser, not the Electron shell.
 */
ipcMain.handle("start-desktop-login", () => {
  const url = `${WEB_URL}/desktop/login?nonce=${desktopNonce}`;
  void shell.openExternal(url);
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────

registerProtocol();

void app.whenReady().then(() => {
  const coldStartArg = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));

  if (coldStartArg) {
    // Defer to handleDeepLink so the auth path goes through nonce validation.
    // Cold-start nonce validation will always fail (we just generated a fresh
    // one), which is the correct behaviour - the original Electron instance
    // that started the flow is gone.
    createWindow("/");
    handleDeepLink(coldStartArg);
  } else {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
