import { headers } from "next/headers";
import { auth, type Session } from "./auth";

export async function getServerSession(): Promise<Session | null> {
  const requestHeaders = await headers();
  return (await auth.api.getSession({
    headers: requestHeaders,
  })) as Session | null;
}
