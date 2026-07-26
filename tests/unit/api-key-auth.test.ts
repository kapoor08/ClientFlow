import { describe, it, expect } from "vitest";
import { hashApiKey } from "@/lib/auth/api-key-hash";

// Imports and exercises the REAL shipped hashApiKey (used by validateApiKey to
// look keys up by hash), not a local re-implementation.
describe("hashApiKey (real implementation)", () => {
  it("matches the known SHA-256 digest of a fixed input", () => {
    // Cross-checked: printf 'clientflow' | sha256sum
    expect(hashApiKey("clientflow")).toBe(
      "d0de4951ca8f674023279cbdbe1df615230c9418bac657dea0be5bc042c0415a",
    );
  });

  it("returns a 64-char lowercase hex string", () => {
    expect(hashApiKey("cfk_live_test123")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashApiKey("cfk_live_abcdef")).toBe(hashApiKey("cfk_live_abcdef"));
  });

  it("maps different keys to different hashes", () => {
    expect(hashApiKey("cfk_live_key1")).not.toBe(hashApiKey("cfk_live_key2"));
  });

  it("is one-way (raw key not present in the hash)", () => {
    const raw = "cfk_live_secretkey";
    expect(hashApiKey(raw)).not.toContain(raw);
  });
});
