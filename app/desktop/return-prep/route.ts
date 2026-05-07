import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { mintExchangeToken } from "@/server/auth/desktop-exchange-store";

const NONCE_PATTERN = /^[a-f0-9]{16,128}$/;

/**
 * Bridge between Better Auth's Google callback and the desktop app.
 *
 * Hit immediately after a successful Google sign-in (Better Auth redirects
 * here via the callbackURL set in /desktop/login). Reads the now-valid
 * session, mints a single-use exchange token bound to the desktop nonce, and
 * redirects to /desktop/return which deep-links into the Electron shell.
 */
export async function GET(request: NextRequest) {
  const nonce = request.nextUrl.searchParams.get("nonce");
  if (!nonce || !NONCE_PATTERN.test(nonce)) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("redirectTo", `/desktop/return-prep?nonce=${nonce}`);
    return NextResponse.redirect(signIn);
  }

  const token = await mintExchangeToken({
    userId: session.user.id,
    nonce,
  });

  const returnUrl = new URL("/desktop/return", request.url);
  returnUrl.searchParams.set("token", token);
  returnUrl.searchParams.set("nonce", nonce);
  return NextResponse.redirect(returnUrl);
}
