import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatBytes } from "@/utils/file";
import { formatCurrency } from "@/utils/currency";
import { getInitials } from "@/utils/user";
import { getEstimateColor } from "@/utils/task";

describe("formatBytes", () => {
  it("returns dash for null/undefined/zero", () => {
    expect(formatBytes(null)).toBe("-");
    expect(formatBytes(undefined)).toBe("-");
    expect(formatBytes(0)).toBe("-");
  });

  it("formats bytes for sub-KB values", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB for sub-MB values", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats MB for larger values", () => {
    expect(formatBytes(5_242_880)).toBe("5.0 MB");
  });
});

describe("formatCurrency", () => {
  it("returns dash for null/undefined", () => {
    expect(formatCurrency(null)).toBe("-");
    expect(formatCurrency(undefined)).toBe("-");
  });

  it("formats USD by default", () => {
    expect(formatCurrency(123456)).toBe("$1,234.56");
  });

  it("respects an explicit currency code", () => {
    const result = formatCurrency(50000, "EUR");
    expect(result).toContain("500");
    expect(result).toMatch(/€|EUR/);
  });

  it("normalizes lowercase currency codes", () => {
    expect(formatCurrency(10000, "usd")).toBe("$100.00");
  });

  it("formats zero cents as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("getInitials", () => {
  it("returns ? for null/empty", () => {
    expect(getInitials(null)).toBe("?");
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });

  it("returns single uppercase letter for one-word names", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("returns two letters for two-word names", () => {
    expect(getInitials("Alice Smith")).toBe("AS");
  });

  it("caps at 2 letters for longer names", () => {
    expect(getInitials("Alice B Smith")).toBe("AB");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  Alice   Smith  ")).toBe("AS");
  });

  it("returns uppercase regardless of input case", () => {
    expect(getInitials("alice smith")).toBe("AS");
  });
});

describe("getEstimateColor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const baseTask = {
    status: "in_progress",
    estimateMinutes: 60,
    estimateSetAt: "2026-04-09T11:00:00Z", // 60 min ago - exactly at estimate
    createdAt: "2026-04-09T10:00:00Z",
  };

  it("returns empty string for tasks without an estimate", () => {
    expect(getEstimateColor({ ...baseTask, estimateMinutes: null })).toBe("");
  });

  it("returns text-success for done tasks", () => {
    expect(getEstimateColor({ ...baseTask, status: "done" })).toBe("text-success");
  });

  it("returns text-danger when elapsed time meets or exceeds estimate", () => {
    expect(getEstimateColor(baseTask)).toBe("text-danger");
  });

  it("returns text-warning at 75% of estimate window", () => {
    expect(
      getEstimateColor({
        ...baseTask,
        estimateSetAt: "2026-04-09T11:15:00Z", // 45 min ago, 75% of 60min budget
      }),
    ).toBe("text-warning");
  });

  it("returns empty string when well within budget", () => {
    expect(
      getEstimateColor({
        ...baseTask,
        estimateSetAt: "2026-04-09T11:55:00Z", // 5 min ago, ~8% of 60min budget
      }),
    ).toBe("");
  });

  it("falls back to createdAt when estimateSetAt is null", () => {
    expect(
      getEstimateColor({
        ...baseTask,
        estimateSetAt: null,
        createdAt: "2026-04-09T11:00:00Z",
      }),
    ).toBe("text-danger");
  });
});
