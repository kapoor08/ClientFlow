import { describe, it, expect } from "vitest";
import { WEBHOOK_EVENTS } from "@/schemas/webhooks";

/**
 * Guards the webhook event matrix against drift between the declared list
 * and the events that lib/clients|projects|tasks + the billing webhook
 * route handler actually dispatch (issue 2.1).
 *
 * If you remove a dispatch site without removing the declared event (or
 * vice versa), this test should be updated as a deliberate decision.
 */
describe("WEBHOOK_EVENTS declared list", () => {
  it("contains exactly the events the app actually fires", () => {
    expect([...WEBHOOK_EVENTS].sort()).toEqual(
      [
        "client.created",
        "client.updated",
        "invoice.paid",
        "invoice.refunded",
        "project.created",
        "project.deleted",
        "project.updated",
        "task.completed",
        "task.created",
        "task.updated",
        "team.member_added",
        "team.member_removed",
      ].sort(),
    );
  });

  it("does not declare invoice.overdue (no scheduler exists)", () => {
    expect(WEBHOOK_EVENTS).not.toContain("invoice.overdue");
  });

  it("each declared event uses the convention <entity>.<action>", () => {
    for (const event of WEBHOOK_EVENTS) {
      expect(event).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });
});
