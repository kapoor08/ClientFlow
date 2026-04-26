import { nextCookies } from "better-auth/next-js";
import { twoFactorClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [nextCookies(), twoFactorClient(), emailOTPClient()],
});
