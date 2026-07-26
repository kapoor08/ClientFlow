// Mock DB schema exports used by unit tests. The db seam is mocked to ignore
// query arguments, so these only need to EXIST (with the columns the code under
// test references) - accessing a missing table would throw when the query
// builder evaluates e.g. `plans.code`.
export const organizationSettings = { organizationId: "organizationId", ssoConfig: "ssoConfig" };
export const organizations = { id: "id", slug: "slug" };
export const organizationMemberships = {
  userId: "userId",
  organizationId: "organizationId",
  status: "status",
};
export const projects = { organizationId: "organizationId", deletedAt: "deletedAt" };
export const clients = { organizationId: "organizationId", deletedAt: "deletedAt" };
export const projectFiles = { organizationId: "organizationId" };
export const tasks = {};
export const webhooks = {};
export const apiKeys = {};
export const timeEntries = {};
export const invoices = {};
export const activityLogs = {};
export const auditLogs = {};
export const notifications = {};
export const projectTemplates = {};
export const plans = { id: "id", code: "code" };
export const subscriptions = { id: "id", planId: "planId", status: "status" };
export const organizationCurrentSubscriptions = {
  organizationId: "organizationId",
  subscriptionId: "subscriptionId",
};
