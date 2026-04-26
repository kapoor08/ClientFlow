export const authRoutes = {
  signIn: "/auth/sign-in",
  signInOtp: "/auth/sign-in-otp",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verifyEmail: "/auth/verify-email",
  dashboard: "/dashboard",
} as const;

export type SignInInput = {
  email: string;
  password: string;
  callbackURL?: string;
};

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  callbackURL?: string;
  /** Cloudflare Turnstile token. Server-side checked when configured. */
  cfTurnstileResponse?: string;
};

export type ForgotPasswordInput = {
  email: string;
  /** Cloudflare Turnstile token. Server-side checked when configured. */
  cfTurnstileResponse?: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type ResendVerificationInput = {
  email: string;
};

export function getFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function getUserInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "ClientFlow";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  return null;
}
