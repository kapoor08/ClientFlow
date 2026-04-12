import { describe, it, expect } from "vitest";
import { parseIdToken, buildOidcAuthorizationUrl } from "@/server/security/sso";

// Helper: build a minimal base64url-encoded JWT (unsigned)
function makeIdToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fakesig`;
}

describe("parseIdToken", () => {
  const clientId = "test-client";
  const nonce = "abc123";

  it("returns user info for a valid token", () => {
    const token = makeIdToken({
      sub: "user-1",
      email: "user@example.com",
      email_verified: true,
      name: "Test User",
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
    });

    const info = parseIdToken(token, nonce, clientId);
    expect(info.sub).toBe("user-1");
    expect(info.email).toBe("user@example.com");
    expect(info.email_verified).toBe(true);
    expect(info.name).toBe("Test User");
  });

  it("accepts audience as array", () => {
    const token = makeIdToken({
      sub: "user-2",
      email: "u@example.com",
      aud: [clientId, "other"],
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
    });
    expect(() => parseIdToken(token, nonce, clientId)).not.toThrow();
  });

  it("throws when token is expired", () => {
    const token = makeIdToken({
      sub: "user-3",
      email: "u@example.com",
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) - 1,
      nonce,
    });
    expect(() => parseIdToken(token, nonce, clientId)).toThrow("expired");
  });

  it("throws on audience mismatch", () => {
    const token = makeIdToken({
      sub: "user-4",
      email: "u@example.com",
      aud: "wrong-client",
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
    });
    expect(() => parseIdToken(token, nonce, clientId)).toThrow("audience mismatch");
  });

  it("throws on nonce mismatch", () => {
    const token = makeIdToken({
      sub: "user-5",
      email: "u@example.com",
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce: "wrong-nonce",
    });
    expect(() => parseIdToken(token, "correct-nonce", clientId)).toThrow("nonce mismatch");
  });

  it("throws when email claim is missing", () => {
    const token = makeIdToken({
      sub: "user-6",
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
    });
    expect(() => parseIdToken(token, nonce, clientId)).toThrow("email claim");
  });

  it("throws on malformed token", () => {
    expect(() => parseIdToken("not.a.valid.jwt.parts", nonce, clientId)).toThrow("Malformed");
  });
});

describe("buildOidcAuthorizationUrl", () => {
  it("builds a correct authorization URL", () => {
    const url = buildOidcAuthorizationUrl({
      authorizationEndpoint: "https://idp.example.com/authorize",
      clientId: "my-client",
      redirectUri: "https://app.example.com/api/auth/sso/callback",
      state: "state-xyz",
      nonce: "nonce-abc",
    });

    const parsed = new URL(url);
    expect(parsed.hostname).toBe("idp.example.com");
    expect(parsed.searchParams.get("client_id")).toBe("my-client");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toContain("openid");
    expect(parsed.searchParams.get("state")).toBe("state-xyz");
    expect(parsed.searchParams.get("nonce")).toBe("nonce-abc");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/auth/sso/callback",
    );
  });

  it("includes login_hint when provided", () => {
    const url = buildOidcAuthorizationUrl({
      authorizationEndpoint: "https://idp.example.com/authorize",
      clientId: "c",
      redirectUri: "https://app.com/cb",
      state: "s",
      nonce: "n",
      loginHint: "user@company.com",
    });
    expect(new URL(url).searchParams.get("login_hint")).toBe("user@company.com");
  });

  it("omits login_hint when not provided", () => {
    const url = buildOidcAuthorizationUrl({
      authorizationEndpoint: "https://idp.example.com/authorize",
      clientId: "c",
      redirectUri: "https://app.com/cb",
      state: "s",
      nonce: "n",
    });
    expect(new URL(url).searchParams.has("login_hint")).toBe(false);
  });
});
