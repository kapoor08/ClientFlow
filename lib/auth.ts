import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, twoFactorTable, user, verification } from "@/db/auth-schema";
import { bootstrapWorkspaceForUser } from "@/lib/organization-settings";
import { sendVerifyEmail, sendPasswordReset } from "@/lib/email";
import { db } from "./db";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";
const requireEmailVerification =
  process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

// Better Auth default token expiries
const VERIFY_EMAIL_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_PASSWORD_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function formatExpiry(ms: number) {
  return new Date(Date.now() + ms).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      isPlatformAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(createdUser) {
          await bootstrapWorkspaceForUser({
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
          });
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      twoFactor: twoFactorTable,
    },
  }),
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification,
    minPasswordLength: 8,
    sendResetPassword: async ({ user: currentUser, url }) => {
      try {
        const result = await sendPasswordReset(currentUser.email, {
          recipient_name: currentUser.name || currentUser.email,
          action_url: url,
          expires_at: formatExpiry(RESET_PASSWORD_EXPIRY_MS),
          support_email: process.env.RESEND_REPLY_TO_EMAIL ?? "",
        });
        if (!result.delivered) {
          console.info(`[BetterAuth:reset-password] ${currentUser.email} -> ${url}`);
        }
      } catch (error) {
        console.error(`[BetterAuth:reset-password] Email delivery failed:`, error);
        console.info(`[BetterAuth:reset-password] Fallback URL for ${currentUser.email} -> ${url}`);
      }
    },
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user: currentUser, url }) => {
      try {
        const result = await sendVerifyEmail(currentUser.email, {
          recipient_name: currentUser.name || currentUser.email,
          action_url: url,
          expires_at: formatExpiry(VERIFY_EMAIL_EXPIRY_MS),
          app_url: baseURL,
        });
        if (!result.delivered) {
          console.info(`[BetterAuth:verify-email] ${currentUser.email} -> ${url}`);
        }
      } catch (error) {
        console.error(`[BetterAuth:verify-email] Email delivery failed:`, error);
        console.info(`[BetterAuth:verify-email] Fallback URL for ${currentUser.email} -> ${url}`);
      }
    },
  },
  plugins: [twoFactor({ issuer: "ClientFlow" })],
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
