import { describe, it, expect } from "vitest";
import {
  computeDayRollup,
  computeWorstStateForDay,
  utcDayStart,
  nextDay,
} from "@/server/status/rollup";

const ok = (latencyMs = 100) => ({ success: true, latencyMs });
const fail = (latencyMs: number | null = null) => ({ success: false, latencyMs });

describe("computeWorstStateForDay", () => {
  it("returns 'unknown' for empty results when not in maintenance", () => {
    expect(computeWorstStateForDay([], false)).toBe("unknown");
  });

  it("returns 'maintenance' regardless of probes when in maintenance", () => {
    expect(computeWorstStateForDay([], true)).toBe("maintenance");
    expect(computeWorstStateForDay([fail(), fail(), fail()], true)).toBe("maintenance");
  });

  it("returns 'operational' when all checks succeed", () => {
    expect(computeWorstStateForDay([ok(), ok(), ok(), ok()], false)).toBe("operational");
  });

  it("returns 'degraded' on any single failure (no consecutive cluster)", () => {
    expect(computeWorstStateForDay([ok(), fail(), ok(), ok(), fail(), ok()], false)).toBe(
      "degraded",
    );
  });

  it("returns 'outage' when a 3+ consecutive failure cluster exists anywhere in the day", () => {
    // Cluster in middle
    expect(computeWorstStateForDay([ok(), ok(), fail(), fail(), fail(), ok(), ok()], false)).toBe(
      "outage",
    );
    // Cluster at start
    expect(computeWorstStateForDay([fail(), fail(), fail(), ok()], false)).toBe("outage");
    // Cluster at end
    expect(computeWorstStateForDay([ok(), fail(), fail(), fail()], false)).toBe("outage");
  });
});

describe("computeDayRollup", () => {
  it("zero-data day returns 100% uptime placeholder + null latency", () => {
    expect(computeDayRollup([], false)).toEqual({
      totalChecks: 0,
      successfulChecks: 0,
      uptimeBp: 10000,
      avgLatencyMs: null,
      worstStateOnDay: "unknown",
    });
  });

  it("computes uptime as basis points (precision without floats)", () => {
    // 7 success out of 10 = 70.00%
    const results = [...Array(7).fill(ok()), ...Array(3).fill(fail())];
    const r = computeDayRollup(results, false);
    expect(r.totalChecks).toBe(10);
    expect(r.successfulChecks).toBe(7);
    expect(r.uptimeBp).toBe(7000);
  });

  it("averages latency only over results that have one", () => {
    const r = computeDayRollup([ok(100), ok(200), fail(null), ok(300)], false);
    // 100, 200, 300 → 200 average
    expect(r.avgLatencyMs).toBe(200);
  });
});

describe("utcDayStart / nextDay", () => {
  it("truncates to UTC midnight", () => {
    const d = new Date("2026-05-03T15:42:11.000Z");
    const start = utcDayStart(d);
    expect(start.toISOString()).toBe("2026-05-03T00:00:00.000Z");
  });

  it("nextDay advances by exactly 24h", () => {
    const start = utcDayStart(new Date("2026-05-03T00:00:00.000Z"));
    expect(nextDay(start).toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });
});
