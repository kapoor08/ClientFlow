import { authClient } from "@/utils/auth-client";
import type {
  ForgotPasswordInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "./entity";
import { authRoutes, getFullName } from "./entity";

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function signInWithEmail(input: SignInInput) {
  const result = await authClient.signIn.email({
    email: input.email.trim(),
    password: input.password,
    callbackURL: input.callbackURL || authRoutes.dashboard,
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to sign in.");
  }

  // BetterAuth sets twoFactorRedirect when the account has 2FA enabled
  if ((result.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
    return { twoFactorRequired: true as const };
  }

  return result.data;
}

export async function verifyTwoFactorCode(code: string) {
  const result = await authClient.twoFactor.verifyTotp({ code });
  if (result.error) {
    throw new Error(result.error.message || "Invalid verification code.");
  }
  return result.data;
}

export async function signInWithGoogle(callbackURL: string = authRoutes.dashboard) {
  const result = await authClient.signIn.social({
    provider: "google",
    callbackURL,
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to continue with Google.");
  }

  return result.data;
}

export async function signUpWithEmail(input: SignUpInput) {
  const result = await authClient.signUp.email({
    name: getFullName(input.firstName, input.lastName),
    email: input.email.trim(),
    password: input.password,
    callbackURL: input.callbackURL || authRoutes.signIn,
    ...(input.cfTurnstileResponse ? { cfTurnstileResponse: input.cfTurnstileResponse } : {}),
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to create your account.");
  }

  return result.data;
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const result = await authClient.requestPasswordReset({
    email: input.email.trim(),
    redirectTo: authRoutes.resetPassword,
    ...(input.cfTurnstileResponse ? { cfTurnstileResponse: input.cfTurnstileResponse } : {}),
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to send a password reset link.");
  }

  return result.data;
}

export async function resetPassword(input: ResetPasswordInput) {
  const result = await authClient.resetPassword({
    token: input.token,
    newPassword: input.password,
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to reset password.");
  }

  return result.data;
}

export async function resendVerificationEmail(input: ResendVerificationInput) {
  const result = await authClient.sendVerificationEmail({
    email: input.email.trim(),
    callbackURL: authRoutes.signIn,
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to resend the verification email.");
  }

  return result.data;
}

export async function signOutUser() {
  const result = await authClient.signOut();

  if (result.error) {
    throw new Error(result.error.message || "Unable to sign out.");
  }

  return result.data;
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  return toErrorMessage(error, fallback);
}
