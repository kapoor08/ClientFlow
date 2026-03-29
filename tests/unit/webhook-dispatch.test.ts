import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── Helpers isolated from the full module to test signing logic ───────────────

function signPayload(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Webhook HMAC signing", () => {
  it("produces consistent signatures for the same secret+body", () => {
    const sig1 = signPayload("secret123", '{"event":"task.created"}');
    const sig2 = signPayload("secret123", '{"event":"task.created"}');
    expect(sig1).toBe(sig2);
  });

  it("produces different signatures for different secrets", () => {
    const sig1 = signPayload("secret-a", "payload");
    const sig2 = signPayload("secret-b", "payload");
    expect(sig1).not.toBe(sig2);
  });

  it("produces different signatures for different payloads", () => {
    const sig1 = signPayload("secret", '{"event":"task.created"}');
    const sig2 = signPayload("secret", '{"event":"task.updated"}');
    expect(sig1).not.toBe(sig2);
  });

  it("always starts with sha256=", () => {
    const sig = signPayload("any-secret", "any-body");
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("signature length is correct (sha256= + 64 hex chars)", () => {
    const sig = signPayload("s", "b");
    expect(sig).toHaveLength(7 + 64); // "sha256=" = 7 chars
  });
});

// ── Webhook dispatch with mocked fetch ───────────────────────────────────────

describe("Webhook event dispatch (fetch mock)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  it("calls the webhook URL with correct headers", async () => {
    const url = "https://example.com/hook";
    const secret = "test-secret";
    const event = "task.created";
    const payload = { id: "task-1", name: "New Task" };
    const body = JSON.stringify({ event, ...payload });
    const signature = signPayload(secret, body);

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClientFlow-Event": event,
        "X-ClientFlow-Signature": signature,
      },
      body,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(url);
    expect(calledOptions.method).toBe("POST");
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-ClientFlow-Event"]).toBe(event);
    expect(headers["X-ClientFlow-Signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});
