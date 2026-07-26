import { describe, it, expect, beforeEach, vi } from "vitest";

// Configurable db seam for these tests. Each awaited query consumes the next
// queued result set (FIFO), so a test scripts the exact rows each internal
// query returns. `rows` is hoisted so the (hoisted) vi.mock factory can close
// over it. This models the multi-query chains in plan-enforcement without a
// real database - the SQL WHERE correctness itself (e.g. the P0-1 status
// filter) is a real-Postgres integration concern, tracked separately.
const { rows } = vi.hoisted(() => ({ rows: [] as unknown[][] }));

vi.mock("@/server/db/client", () => {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  for (const m of [
    "select",
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "limit",
    "groupBy",
    "orderBy",
  ]) {
    chain[m] = ret;
  }
  // Awaiting the chain at the end of a query yields the next queued result set.
  (chain as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(rows.shift() ?? []);
  return { db: chain };
});

import {
  enforceClientCap,
  enforceMemberCap,
  getClientCapStatus,
  PlanLimitError,
} from "@/server/subscription/plan-enforcement";

const ORG = "org_test";

beforeEach(() => {
  rows.length = 0;
});

describe("enforceClientCap", () => {
  it("skips enforcement for an unlimited (professional) plan", async () => {
    rows.push([{ code: "professional" }]); // getOrgPlanCode -> unlimited, no count query
    await expect(enforceClientCap(ORG)).resolves.toBeUndefined();
  });

  it("passes when under the free-plan client cap", async () => {
    rows.push([{ code: "free" }]); // plan code
    rows.push([{ total: 2 }]); // countActiveClients
    await expect(enforceClientCap(ORG)).resolves.toBeUndefined();
  });

  it("throws PlanLimitError with correct meta when at the cap", async () => {
    rows.push([{ code: "free" }]);
    rows.push([{ total: 5 }]); // free clients limit is 5 -> 5 >= 5
    await expect(enforceClientCap(ORG)).rejects.toMatchObject({
      name: "PlanLimitError",
      statusCode: 402,
      meta: { featureKey: "clients", limit: 5, current: 5, upgradeUrl: "/billing" },
    });
  });

  it("enforces free caps when the entitlement query returns no row (P0-1: canceled org -> free)", async () => {
    // A canceled/unpaid subscription is filtered out by the entitled-status
    // WHERE clause, so the current-subscription lookup returns nothing and the
    // org must be treated as free - and its restrictive caps enforced.
    rows.push([]); // getOrgPlanCode -> [] -> "free"
    rows.push([{ total: 5 }]);
    await expect(enforceClientCap(ORG)).rejects.toBeInstanceOf(PlanLimitError);
  });
});

describe("enforceMemberCap", () => {
  it("throws with the team_members feature key at the seat cap", async () => {
    rows.push([{ code: "free" }]); // free teamMembers limit is 2
    rows.push([{ total: 2 }]);
    await expect(enforceMemberCap(ORG)).rejects.toMatchObject({
      meta: { featureKey: "team_members", limit: 2, current: 2 },
    });
  });
});

describe("getClientCapStatus", () => {
  it("reports unlimited for a professional plan", async () => {
    rows.push([{ code: "professional" }]);
    await expect(getClientCapStatus(ORG)).resolves.toEqual({
      used: 0,
      limit: null,
      atLimit: false,
    });
  });

  it("reports atLimit once usage reaches the cap", async () => {
    rows.push([{ code: "starter" }]); // starter clients limit is 15
    rows.push([{ total: 15 }]);
    await expect(getClientCapStatus(ORG)).resolves.toEqual({
      used: 15,
      limit: 15,
      atLimit: true,
    });
  });
});
