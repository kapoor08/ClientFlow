import type { Metadata } from "next";
import AnalyticsPage from ".";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <AnalyticsPage {...props} />;
}
