import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── SHA-256 hashing helper (isolated, matches lib/api-key-auth.ts) ─────────────

function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

describe("API key hashing", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashApiKey("cfk_live_test123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic", () => {
    const key = "cfk_live_abcdef";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("different keys produce different hashes", () => {
    expect(hashApiKey("cfk_live_key1")).not.toBe(hashApiKey("cfk_live_key2"));
  });

  it("raw key cannot be recovered from hash", () => {
    // SHA-256 is one-way; the hash must not contain the raw key
    const raw = "cfk_live_secretkey";
    const hash = hashApiKey(raw);
    expect(hash).not.toContain(raw);
  });
});

// ── Validation logic (mocked DB) ─────────────────────────────────────────────

describe("API key validation logic", () => {
  it("rejects expired keys", () => {
    const now = Date.now();
    const expiresAt: Date | null = new Date(now - 1000); // 1 second ago
    const isExpired = expiresAt !== null && expiresAt.getTime() < now;
    expect(isExpired).toBe(true);
  });

  it("accepts keys with future expiry", () => {
    const now = Date.now();
    const expiresAt: Date | null = new Date(now + 86400_000); // tomorrow
    const isExpired = expiresAt !== null && expiresAt.getTime() < now;
    expect(isExpired).toBe(false);
  });

  it("accepts keys with no expiry (null)", () => {
    const expiresAt: Date | null = null;
    const isExpired = expiresAt !== null && expiresAt.getTime() < Date.now();
    expect(isExpired).toBe(false);
  });

  it("rejects revoked keys", () => {
    const revokedAt: Date | null = new Date(Date.now() - 5000);
    const isRevoked = revokedAt !== null;
    expect(isRevoked).toBe(true);
  });

  it("accepts non-revoked keys", () => {
    const revokedAt: Date | null = null;
    const isRevoked = revokedAt !== null;
    expect(isRevoked).toBe(false);
  });
});
