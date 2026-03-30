import type { Metadata } from "next";
import BillingPage from "./index";

export const metadata: Metadata = {
  title: "Billing",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <BillingPage {...props} />;
}
