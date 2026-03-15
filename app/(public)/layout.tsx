import type { ReactNode } from "react";
import PublicLayout from "@/components/layout/PublicLayout";

type PublicRouteLayoutProps = {
  children: ReactNode;
};

export default function PublicRouteLayout({
  children,
}: PublicRouteLayoutProps) {
  return <PublicLayout>{children}</PublicLayout>;
}
