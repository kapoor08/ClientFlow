import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { consumeExchangeToken } from "./desktop-exchange-store";

/**
 * Better Auth plugin that exposes /sign-in/desktop-exchange.
 *
 * The Electron shell completes Google OAuth in the user's system browser, the
 * callback mints a one-time exchange token tied to a per-instance nonce, and
 * Electron loads /desktop/exchange in its own BrowserWindow which calls this
 * endpoint to materialise a session cookie scoped to Electron's session.
 *
 * Token is single-use and 60s-lived (enforced by Redis TTL + GETDEL). The
 * nonce binds redemption to the specific Electron instance that initiated the
 * flow, so a leaked URL can't be redeemed from a different machine.
 */
export const desktopExchangePlugin = () => ({
  id: "desktop-exchange",
  endpoints: {
    signInDesktopExchange: createAuthEndpoint(
      "/sign-in/desktop-exchange",
      {
        method: "POST",
        body: z.object({
          token: z.string().length(64),
          nonce: z.string().min(16).max(128),
        }),
      },
      async (ctx) => {
        const { token, nonce } = ctx.body;

        const payload = await consumeExchangeToken(token);
        if (!payload) {
          throw new APIError("UNAUTHORIZED", {
            message: "Exchange token is invalid or expired.",
          });
        }
        if (payload.nonce !== nonce) {
          throw new APIError("UNAUTHORIZED", {
            message: "Exchange token does not match this desktop session.",
          });
        }

        const userResult = await ctx.context.internalAdapter.findUserById(payload.userId);
        if (!userResult) {
          throw new APIError("UNAUTHORIZED", { message: "User no longer exists." });
        }

        const session = await ctx.context.internalAdapter.createSession(payload.userId);
        await setSessionCookie(ctx, { session, user: userResult });

        return ctx.json({ ok: true });
      },
    ),
  },
});
