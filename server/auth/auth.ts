import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { twoFactor, emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, twoFactorTable, user, verification } from "@/db/auth-schema";
import { bootstrapWorkspaceForUser } from "@/server/organization-settings";
import { sendVerifyEmail, sendPasswordReset, sendSignInOtp } from "@/server/email/send";
import { db } from "@/server/db/client";
import { signInLockout, lockoutKey } from "@/server/rate-limit";
import { validatePassword } from "@/lib/password-policy";
import { verifyTurnstileToken, isTurnstileConfigured } from "@/server/security/turnstile";

const baseURL =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const requireEmailVerification = process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION === "true";

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
  /**
   * Production cookie hardening. Better Auth defaults are reasonable but we
   * pin them explicitly for production:
   *   - `secure: true`        - never send over HTTP
   *   - `sameSite: "lax"`     - allow OAuth redirect chains; "strict" would
   *     break the Google sign-in callback because the post-redirect request
   *     to `/api/auth/callback/google` is cross-site.
   *   - `httpOnly: true`      - already the default; declared for visibility.
   * Dev keeps the defaults so cookies still work over HTTP on localhost.
   */
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
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
        if (!result?.delivered) {
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
        if (!result?.delivered) {
          console.info(`[BetterAuth:verify-email] ${currentUser.email} -> ${url}`);
        }
      } catch (error) {
        console.error(`[BetterAuth:verify-email] Email delivery failed:`, error);
        console.info(`[BetterAuth:verify-email] Fallback URL for ${currentUser.email} -> ${url}`);
      }
    },
  },
  hooks: {
    /**
     * Before-hook chain.
     *
     *  1. /sign-up/email & /reset-password - enforce password complexity policy
     *     (lib/password-policy). Throwing APIError here aborts the request with
     *     a 422 + the readable rule message.
     *
     *  2. /sign-in/email - per-email lockout. Five failed attempts in any
     *     15-minute window blocks further attempts on that account regardless
     *     of source IP. Counter only increments on actual sign-in attempts and
     *     is not reset on success - under threshold it expires naturally.
     */
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;

      if (path === "/sign-up/email" || path === "/reset-password") {
        const pwd = (ctx.body as { password?: unknown } | undefined)?.password;
        const err = validatePassword(pwd);
        if (err) {
          throw new APIError("UNPROCESSABLE_ENTITY", { message: err });
        }
      }

      // Turnstile gate on the bot-attractive endpoints. Soft-skips locally
      // when TURNSTILE_SECRET_KEY isn't set.
      if (
        isTurnstileConfigured &&
        (path === "/sign-up/email" || path === "/request-password-reset")
      ) {
        const body = ctx.body as { cfTurnstileResponse?: unknown } | undefined;
        const captcha = await verifyTurnstileToken(
          typeof body?.cfTurnstileResponse === "string" ? body.cfTurnstileResponse : null,
        );
        if (!captcha.ok) {
          throw new APIError("UNPROCESSABLE_ENTITY", {
            message: "Bot challenge failed. Please try again.",
          });
        }
      }

      if (path === "/sign-in/email") {
        const email = (ctx.body as { email?: unknown } | undefined)?.email;
        if (typeof email === "string" && email.length > 0) {
          const { success } = await signInLockout.limit(lockoutKey(email));
          if (!success) {
            throw new APIError("TOO_MANY_REQUESTS", {
              message:
                "Too many failed attempts. Try again in a few minutes or reset your password.",
            });
          }
        }
      }
    }),
  },
  plugins: [
    twoFactor({ issuer: "ClientFlow" }),
    /**
     * Email-OTP fallback. Lets users sign in with a 6-digit code emailed to
     * them when their password is unavailable (forgotten, away from password
     * manager, etc). Reuses the same outbound-email pipeline so suppression
     * + category preferences still apply - though `module: "auth"` puts it in
     * the critical-bypass list, so opt-outs don't block the code.
     */
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60, // 10 minutes - balances forwarding delays vs replay
      sendVerificationOTP: async ({ email, otp }) => {
        try {
          await sendSignInOtp(email, {
            recipient_name: email,
            otp,
            expires_in_minutes: "10",
          });
        } catch (error) {
          console.error(`[BetterAuth:sign-in-otp] delivery failed:`, error);
          console.info(`[BetterAuth:sign-in-otp] Fallback OTP for ${email}: ${otp}`);
        }
      },
    }),
  ],
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
