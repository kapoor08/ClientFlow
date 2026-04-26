/**
 * Centralized password policy. Used at sign-up and password-reset boundaries.
 * Returns null on success or a human-readable error message on failure.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RULES = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  "One uppercase letter (A-Z)",
  "One lowercase letter (a-z)",
  "One number (0-9)",
  "One symbol (!@#$%^&* etc.)",
] as const;

export function validatePassword(input: unknown): string | null {
  if (typeof input !== "string") return "Password is required.";
  if (input.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (input.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(input)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(input)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(input)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(input)) return "Password must contain a symbol.";
  return null;
}
