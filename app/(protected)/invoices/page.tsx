import type { Metadata } from "next";
import InvoicesPage from "./index";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <InvoicesPage {...props} />;
}
