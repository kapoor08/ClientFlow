import { describe, it, expect } from "vitest";
import { signWebhookPayload } from "@/lib/webhooks/signature";

// Imports and exercises the REAL shipped signing helper used by the webhook
// dispatcher and the /test endpoint, not a local re-implementation.
describe("signWebhookPayload (real implementation)", () => {
  it("matches the known HMAC-SHA256 digest", () => {
    // Cross-checked: crypto.createHmac('sha256','secret').update('hello').digest('hex')
    expect(signWebhookPayload("secret", "hello")).toBe(
      "88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b",
    );
  });

  it("is deterministic for the same secret + body", () => {
    expect(signWebhookPayload("s1", '{"event":"task.created"}')).toBe(
      signWebhookPayload("s1", '{"event":"task.created"}'),
    );
  });

  it("differs for different secrets", () => {
    expect(signWebhookPayload("a", "payload")).not.toBe(signWebhookPayload("b", "payload"));
  });

  it("differs for different payloads", () => {
    expect(signWebhookPayload("s", '{"event":"a"}')).not.toBe(
      signWebhookPayload("s", '{"event":"b"}'),
    );
  });

  it("is a 64-char hex digest (the wire header prepends sha256=)", () => {
    expect(signWebhookPayload("s", "b")).toMatch(/^[a-f0-9]{64}$/);
  });
});
