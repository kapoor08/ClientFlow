import type { ReactNode } from "react";
import PublicLayout from "@/components/layout/public/PublicLayout";

type PublicRouteLayoutProps = {
  children: ReactNode;
};

export default function PublicRouteLayout({
  children,
}: PublicRouteLayoutProps) {
  return <PublicLayout>{children}</PublicLayout>;
}
