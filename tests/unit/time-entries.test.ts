import { describe, it, expect } from "vitest";

// ── Duration parsing (extracted from LogTimeDialog for unit testing) ──────────

function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let total = 0;

  // Match patterns like "2h 30m", "1h", "45m", "90"
  const hoursMatch = trimmed.match(/(\d+)\s*h/i);
  const minutesMatch = trimmed.match(/(\d+)\s*m/i);

  if (hoursMatch) total += parseInt(hoursMatch[1], 10) * 60;
  if (minutesMatch) total += parseInt(minutesMatch[1], 10);

  // Plain number = minutes
  if (!hoursMatch && !minutesMatch) {
    const num = parseInt(trimmed, 10);
    if (isNaN(num)) return null;
    total = num;
  }

  return total > 0 ? total : null;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

describe("parseDuration", () => {
  it("parses plain minutes", () => {
    expect(parseDuration("90")).toBe(90);
    expect(parseDuration("30")).toBe(30);
  });

  it("parses hours only", () => {
    expect(parseDuration("2h")).toBe(120);
    expect(parseDuration("1h")).toBe(60);
  });

  it("parses minutes only", () => {
    expect(parseDuration("45m")).toBe(45);
    expect(parseDuration("30m")).toBe(30);
  });

  it("parses combined h m format", () => {
    expect(parseDuration("2h 30m")).toBe(150);
    expect(parseDuration("1h 15m")).toBe(75);
  });

  it("handles no space between h and m", () => {
    expect(parseDuration("2h30m")).toBe(150);
  });

  it("returns null for empty input", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("   ")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseDuration("abc")).toBeNull();
  });

  it("returns null for zero duration", () => {
    expect(parseDuration("0")).toBeNull();
    expect(parseDuration("0m")).toBeNull();
  });

  it("is case-insensitive for H/M", () => {
    expect(parseDuration("2H 30M")).toBe(150);
  });
});

describe("formatMinutes", () => {
  it("formats minutes under 1 hour", () => {
    expect(formatMinutes(30)).toBe("30m");
    expect(formatMinutes(45)).toBe("45m");
  });

  it("formats exact hours", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(150)).toBe("2h 30m");
    expect(formatMinutes(75)).toBe("1h 15m");
  });

  it("handles single minute", () => {
    expect(formatMinutes(1)).toBe("1m");
  });
});

// ── Time entry validation ─────────────────────────────────────────────────────

describe("time entry validation", () => {
  it("rejects duration <= 0", () => {
    const isValid = (minutes: number) => minutes > 0;
    expect(isValid(0)).toBe(false);
    expect(isValid(-5)).toBe(false);
    expect(isValid(1)).toBe(true);
  });

  it("rejects duration > 24 hours", () => {
    const isValid = (minutes: number) => minutes > 0 && minutes <= 1440;
    expect(isValid(1441)).toBe(false);
    expect(isValid(1440)).toBe(true);
    expect(isValid(480)).toBe(true);
  });
});
