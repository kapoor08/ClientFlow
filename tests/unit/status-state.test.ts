import { describe, it, expect } from "vitest";
import {
  deriveStateFromResults,
  RECENT_WINDOW,
  CONSECUTIVE_OUTAGE_THRESHOLD,
} from "@/server/status/state";

const ok = { success: true } as const;
const fail = { success: false } as const;

describe("deriveStateFromResults", () => {
  it("returns 'unknown' when no results exist", () => {
    expect(deriveStateFromResults([], false)).toBe("unknown");
  });

  it("returns 'maintenance' when in maintenance regardless of probes", () => {
    expect(deriveStateFromResults([fail, fail, fail], true)).toBe("maintenance");
    expect(deriveStateFromResults([ok, ok, ok], true)).toBe("maintenance");
    expect(deriveStateFromResults([], true)).toBe("maintenance");
  });

  it("returns 'operational' when all results succeeded", () => {
    expect(deriveStateFromResults([ok, ok, ok, ok, ok], false)).toBe("operational");
  });

  it("returns 'outage' when N most-recent results are consecutive failures", () => {
    // Most-recent first: 3 consecutive failures at the leading edge.
    const results = [fail, fail, fail, ok, ok];
    expect(deriveStateFromResults(results, false)).toBe("outage");
  });

  it("does NOT flip to outage when failures aren't consecutive at the leading edge", () => {
    // Failures interleaved with successes - degraded but not outage.
    const results = [ok, fail, fail, fail, ok];
    expect(deriveStateFromResults(results, false)).toBe("degraded");
  });

  it("returns 'degraded' on a single recent failure", () => {
    const results = [ok, fail, ok, ok, ok];
    expect(deriveStateFromResults(results, false)).toBe("degraded");
  });

  it("returns 'degraded' when 2 consecutive failures exist (below outage threshold)", () => {
    const results = [fail, fail, ok, ok, ok];
    expect(deriveStateFromResults(results, false)).toBe("degraded");
  });

  it("constants are sensible", () => {
    expect(RECENT_WINDOW).toBeGreaterThanOrEqual(CONSECUTIVE_OUTAGE_THRESHOLD);
    expect(CONSECUTIVE_OUTAGE_THRESHOLD).toBeGreaterThanOrEqual(2);
  });
});
