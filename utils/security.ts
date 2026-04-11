import { Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";

export function parseDevice(
  userAgent: string | null,
): { label: string; Icon: LucideIcon } {
  if (!userAgent) return { label: "Unknown device", Icon: Monitor };
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || (ua.includes("android") && ua.includes("mobile"))) {
    return { label: "Mobile", Icon: Smartphone };
  }
  if (ua.includes("ipad") || ua.includes("tablet")) {
    return { label: "Tablet", Icon: Tablet };
  }
  return { label: "Desktop", Icon: Monitor };
}

export function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return "Unknown browser";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/") || userAgent.includes("Opera")) return "Opera";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Safari/") && userAgent.includes("Version/")) {
    return "Safari";
  }
  if (userAgent.includes("Firefox/")) return "Firefox";
  return "Browser";
}

export function parseOs(userAgent: string | null): string {
  if (!userAgent) return "";
  if (userAgent.includes("Windows NT 10")) return "Windows 10/11";
  if (userAgent.includes("Windows NT")) return "Windows";
  if (userAgent.includes("Mac OS X")) return "macOS";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("Linux")) return "Linux";
  return "";
}
