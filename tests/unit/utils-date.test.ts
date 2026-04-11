import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, formatTimeAgo, formatMinutes } from "@/utils/date";

describe("formatDate", () => {
  it("returns dash for null/undefined", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });

  it("returns dash for invalid date strings", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });

  it("formats a Date object with short month by default", () => {
    expect(formatDate(new Date("2026-01-15T12:00:00Z"))).toMatch(/Jan 1[45], 2026/);
  });

  it("formats an ISO string", () => {
    expect(formatDate("2026-03-05T00:00:00Z")).toMatch(/Mar [45], 2026/);
  });

  it("uses long month when long: true", () => {
    expect(formatDate("2026-01-15T12:00:00Z", { long: true })).toMatch(/January 1[45], 2026/);
  });

  it("includes time when withTime: true", () => {
    const result = formatDate("2026-01-15T14:30:00Z", { withTime: true });
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatTimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns dash for null/undefined", () => {
    expect(formatTimeAgo(null)).toBe("-");
    expect(formatTimeAgo(undefined)).toBe("-");
  });

  it("returns 'just now' for under 1 minute", () => {
    expect(formatTimeAgo("2026-04-09T11:59:30Z")).toBe("just now");
  });

  it("returns minutes ago for under 1 hour", () => {
    expect(formatTimeAgo("2026-04-09T11:35:00Z")).toBe("25m ago");
  });

  it("returns hours ago for under 1 day", () => {
    expect(formatTimeAgo("2026-04-09T05:00:00Z")).toBe("7h ago");
  });

  it("returns days ago for under 30 days", () => {
    expect(formatTimeAgo("2026-04-04T12:00:00Z")).toBe("5d ago");
  });

  it("falls back to formatted date for older than 30 days", () => {
    const result = formatTimeAgo("2026-02-01T12:00:00Z");
    expect(result).toMatch(/Feb 1, 2026/);
  });
});

describe("formatMinutes", () => {
  it("returns 0h for zero or negative minutes", () => {
    expect(formatMinutes(0)).toBe("0h");
    expect(formatMinutes(-5)).toBe("0h");
  });

  it("returns minutes only when under 1 hour", () => {
    expect(formatMinutes(45)).toBe("45m");
  });

  it("returns hours only when exactly on the hour", () => {
    expect(formatMinutes(120)).toBe("2h");
  });

  it("returns hours and minutes for mixed values", () => {
    expect(formatMinutes(150)).toBe("2h 30m");
  });
});
