import { describe, it, expect } from "vitest";
import { assertSafeWebhookUrl, UnsafeWebhookUrlError } from "@/server/webhooks/url-guard";

// Critical-path security test for the outbound-webhook SSRF guard (P1-8). Covers
// the syntactic layer (scheme + private/loopback/link-local IP literals +
// internal hostnames); the DNS-resolution layer is exercised at runtime.
describe("assertSafeWebhookUrl (SSRF guard)", () => {
  it("accepts a normal https public URL", () => {
    expect(() => assertSafeWebhookUrl("https://hooks.example.com/webhook")).not.toThrow();
  });

  it("rejects non-https schemes", () => {
    expect(() => assertSafeWebhookUrl("http://example.com")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("ftp://example.com")).toThrow(UnsafeWebhookUrlError);
  });

  it("rejects loopback / localhost (IPv4 + IPv6)", () => {
    expect(() => assertSafeWebhookUrl("https://127.0.0.1/x")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("https://localhost/x")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("https://[::1]/x")).toThrow(UnsafeWebhookUrlError);
  });

  it("rejects cloud-metadata link-local and RFC1918 private ranges", () => {
    expect(() => assertSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).toThrow(
      UnsafeWebhookUrlError,
    );
    expect(() => assertSafeWebhookUrl("https://10.0.0.5/x")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("https://192.168.1.10/x")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("https://172.16.0.1/x")).toThrow(UnsafeWebhookUrlError);
  });

  it("rejects internal hostnames", () => {
    expect(() => assertSafeWebhookUrl("https://db.internal/x")).toThrow(UnsafeWebhookUrlError);
    expect(() => assertSafeWebhookUrl("https://service.local/x")).toThrow(UnsafeWebhookUrlError);
  });

  it("rejects malformed URLs", () => {
    expect(() => assertSafeWebhookUrl("not a url")).toThrow(UnsafeWebhookUrlError);
  });
});
