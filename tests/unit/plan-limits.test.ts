import { describe, it, expect } from "vitest";
import { getPlanLimits, canAccessHref, PLAN_LIMITS } from "@/config/plan-limits";

// Critical-path coverage for the entitlement/RBAC decision layer. These pure
// functions gate revenue features and module access, and they are the fallback
// half of P0-1: a canceled/unpaid org resolves to the "free" plan code
// (getOrgPlanCode returns "free"), so getPlanLimits("free") MUST yield the
// restrictive caps and an unknown code MUST NOT accidentally grant more.

describe("getPlanLimits", () => {
  it("returns the restrictive free caps for the free plan", () => {
    const free = getPlanLimits("free");
    expect(free.clients).toBe(5);
    expect(free.projects).toBe(3);
    expect(free.teamMembers).toBe(2);
    expect(free.filesPerProject).toBe(5);
    expect(free.tasksPerMonth).toBe(20);
    expect(free.commentsPerMonth).toBe(30);
    expect(free.fileUploadsPerMonth).toBe(10);
  });

  it("returns finite caps for starter", () => {
    const starter = getPlanLimits("starter");
    expect(starter.clients).toBe(15);
    expect(starter.projects).toBe(10);
    expect(starter.teamMembers).toBe(5);
  });

  it("treats professional and enterprise as unlimited (null caps)", () => {
    for (const code of ["professional", "enterprise"] as const) {
      const limits = getPlanLimits(code);
      expect(limits.clients).toBeNull();
      expect(limits.projects).toBeNull();
      expect(limits.teamMembers).toBeNull();
      expect(limits.filesPerProject).toBeNull();
    }
  });

  it("falls back to free for unknown / empty / canceled-org plan codes (P0-1 safety net)", () => {
    // getOrgPlanCode returns "free" for a canceled org; any unrecognized code
    // must degrade to free, never to a more permissive plan.
    for (const code of ["", "bogus", "canceled", "PROFESSIONAL"]) {
      expect(getPlanLimits(code)).toEqual(PLAN_LIMITS.free);
    }
  });
});

describe("canAccessHref (plan-based module gating)", () => {
  it("blocks free-plan orgs from starter-only modules", () => {
    expect(canAccessHref("free", "/dashboard")).toBe(true);
    expect(canAccessHref("free", "/clients")).toBe(true);
    // /settings, /teams, /invitations are NOT in the free allowlist
    expect(canAccessHref("free", "/settings")).toBe(false);
    expect(canAccessHref("free", "/teams")).toBe(false);
    expect(canAccessHref("free", "/invitations")).toBe(false);
  });

  it("grants starter orgs the expanded module set", () => {
    expect(canAccessHref("starter", "/settings")).toBe(true);
    expect(canAccessHref("starter", "/teams")).toBe(true);
    expect(canAccessHref("starter", "/invitations")).toBe(true);
  });

  it("grants professional/enterprise unrestricted access (null allowlist)", () => {
    expect(canAccessHref("professional", "/settings")).toBe(true);
    expect(canAccessHref("professional", "/anything/at/all")).toBe(true);
    expect(canAccessHref("enterprise", "/admin")).toBe(true);
  });

  it("matches by path prefix, and gates unknown codes as free", () => {
    // Nested route under an allowed prefix is permitted.
    expect(canAccessHref("free", "/projects/123/edit")).toBe(true);
    // Unknown code degrades to the free allowlist.
    expect(canAccessHref("bogus", "/settings")).toBe(false);
    expect(canAccessHref("bogus", "/dashboard")).toBe(true);
  });
});
