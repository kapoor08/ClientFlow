import type { Metadata } from "next";
import { DesktopHero, DesktopFeatures } from "@/components/desktop";

export const metadata: Metadata = {
  title: "ClientFlow Desktop",
  description:
    "Download ClientFlow Desktop for Mac, Windows, and Linux. A dedicated window for your daily client work.",
};

export default function DesktopAppPage() {
  return (
    <>
      <DesktopHero />
      <DesktopFeatures />
    </>
  );
}
