import { describe, it, expect } from "vitest";
import { parseEstimate } from "@/components/form/utilities/TimeEstimateInput";

// Imports and exercises the REAL shipped parseEstimate (the previous test tested
// a local `parseDuration` that does not exist in source). Assertions match
// parseEstimate's actual semantics: null for empty / zero-total, undefined for
// invalid format, tokens w/d/h/m with 1w=2400m, 1d=480m, 1h=60m.
describe("parseEstimate (real implementation)", () => {
  it("parses hours and minutes", () => {
    expect(parseEstimate("1h")).toBe(60);
    expect(parseEstimate("45m")).toBe(45);
    expect(parseEstimate("2h 30m")).toBe(150);
    expect(parseEstimate("2h30m")).toBe(150); // spaces are optional
  });

  it("parses days and weeks", () => {
    expect(parseEstimate("1d")).toBe(480);
    expect(parseEstimate("1w")).toBe(2400);
    expect(parseEstimate("1w 2d 3h")).toBe(2400 + 960 + 180); // 3540
  });

  it("is case-insensitive", () => {
    expect(parseEstimate("2H 30M")).toBe(150);
  });

  it("returns null for empty / whitespace input", () => {
    expect(parseEstimate("")).toBeNull();
    expect(parseEstimate("   ")).toBeNull();
  });

  it("returns null for a zero total", () => {
    expect(parseEstimate("0m")).toBeNull();
  });

  it("returns undefined for invalid formats", () => {
    expect(parseEstimate("abc")).toBeUndefined();
    expect(parseEstimate("90")).toBeUndefined(); // plain number, no unit token
    expect(parseEstimate("2h foo")).toBeUndefined();
  });
});
