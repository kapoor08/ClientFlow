import { describe, it, expect } from "vitest";
import { PlanLimitError } from "@/server/subscription/plan-enforcement";
import { apiErrorResponse } from "@/server/api/helpers";

describe("PlanLimitError", () => {
  it("carries structured meta", () => {
    const err = new PlanLimitError("over the cap", {
      featureKey: "clients",
      limit: 5,
      current: 5,
      upgradeUrl: "/billing",
    });
    expect(err.statusCode).toBe(402);
    expect(err.meta).toEqual({
      featureKey: "clients",
      limit: 5,
      current: 5,
      upgradeUrl: "/billing",
    });
  });
});

describe("apiErrorResponse(PlanLimitError)", () => {
  it("maps to a 402 with the structured upgrade payload", async () => {
    const err = new PlanLimitError("over the cap", {
      featureKey: "projects",
      limit: 3,
      current: 3,
      upgradeUrl: "/billing",
    });
    const res = apiErrorResponse(err);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body).toEqual({
      error: "over the cap",
      upgrade: true,
      featureKey: "projects",
      limit: 3,
      current: 3,
      upgradeUrl: "/billing",
    });
  });
});
