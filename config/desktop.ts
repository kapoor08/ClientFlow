/**
 * Single source of truth for the desktop installer URLs.
 *
 * The desktop installers are produced by `npm run desktop:package:*` and
 * published to GitHub Releases. The marketing page links directly to the
 * "latest" download paths so we never have to bump version numbers in the
 * UI when a new release ships.
 *
 * Override the repo via NEXT_PUBLIC_DESKTOP_RELEASE_REPO if you need to
 * point at a different repository (e.g. a private release mirror).
 */
const REPO = process.env.NEXT_PUBLIC_DESKTOP_RELEASE_REPO || "kapoor08/ClientFlow";

const RELEASES_BASE = `https://github.com/${REPO}/releases`;

export const desktopConfig = {
  repo: REPO,
  releasesUrl: RELEASES_BASE,
  latestUrl: `${RELEASES_BASE}/latest`,
  /**
   * Static download paths. electron-builder names artifacts with the version
   * by default (e.g. ClientFlow-Setup-0.1.0.exe), so we rely on GitHub's
   * "/latest/download/<filename-without-version>" alias. The repo's release
   * assets need to be uploaded with the matching filename.
   */
  downloads: {
    win: `${RELEASES_BASE}/latest/download/ClientFlow-Setup.exe`,
    mac: `${RELEASES_BASE}/latest/download/ClientFlow.dmg`,
    linux: `${RELEASES_BASE}/latest/download/ClientFlow.AppImage`,
  },
} as const;

export type DesktopOS = "win" | "mac" | "linux";

export const osLabels: Record<DesktopOS, string> = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
};
