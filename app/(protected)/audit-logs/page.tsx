import type { Metadata } from "next";
import AuditLogsPage from ".";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <AuditLogsPage {...props} />;
}
