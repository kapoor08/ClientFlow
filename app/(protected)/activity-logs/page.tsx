import type { Metadata } from "next";
import ActivityLogsPage from ".";

export const metadata: Metadata = {
  title: "Activity Logs",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <ActivityLogsPage {...props} />;
}
