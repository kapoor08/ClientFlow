import type { Metadata } from "next";
import InvitationsPage from ".";

export const metadata: Metadata = {
  title: "Invitations",
};

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <InvitationsPage {...props} />;
}
