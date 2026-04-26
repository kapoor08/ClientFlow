/**
 * Activation funnel events. Names are deliberately stable - dashboards in
 * PostHog are keyed off these strings.
 *
 * The funnel:
 *   1. sign_up_started        - user lands on /auth/sign-up
 *   2. sign_up_done           - user successfully created an account
 *   3. first_project_created  - user shipped their first project (org-level)
 *   4. first_invoice_paid     - first paid invoice for the org
 *   5. plan_upgraded          - subscription moved to a different plan
 */

export const FUNNEL_EVENTS = {
  signUpStarted: "sign_up_started",
  signUpDone: "sign_up_done",
  firstProjectCreated: "first_project_created",
  firstInvoicePaid: "first_invoice_paid",
  planUpgraded: "plan_upgraded",
} as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];
