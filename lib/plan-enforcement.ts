import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  projects,
  projectFiles,
  plans,
  subscriptions,
  organizationCurrentSubscriptions,
} from "@/db/schema";
import { getPlanLimits } from "@/config/plan-limits";
import { checkMonthlyUsage, incrementMonthlyUsage } from "@/lib/usage";

// ─── Error ────────────────────────────────────────────────────────────────────

export class PlanLimitError extends Error {
  readonly statusCode = 402;
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrgPlanCode(organizationId: string): Promise<string> {
  const [row] = await db
    .select({ code: plans.code })
    .from(organizationCurrentSubscriptions)
    .innerJoin(
      subscriptions,
      eq(organizationCurrentSubscriptions.subscriptionId, subscriptions.id),
    )
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(organizationCurrentSubscriptions.organizationId, organizationId))
    .limit(1);

  return row?.code ?? "free";
}

// ─── Entity cap checks ────────────────────────────────────────────────────────

export async function enforceClientCap(organizationId: string): Promise<void> {
  const planCode = await getOrgPlanCode(organizationId);
  const limit = getPlanLimits(planCode).clients;
  if (limit === null) return;

  const [{ total }] = await db
    .select({ total: count() })
    .from(clients)
    .where(
      and(eq(clients.organizationId, organizationId), isNull(clients.deletedAt)),
    );

  if (total >= limit) {
    throw new PlanLimitError(
      `You've reached the ${limit}-client limit on your current plan. Upgrade to add more clients.`,
    );
  }
}

export async function enforceProjectCap(organizationId: string): Promise<void> {
  const planCode = await getOrgPlanCode(organizationId);
  const limit = getPlanLimits(planCode).projects;
  if (limit === null) return;

  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt),
      ),
    );

  if (total >= limit) {
    throw new PlanLimitError(
      `You've reached the ${limit}-project limit on your current plan. Upgrade to add more projects.`,
    );
  }
}

export async function enforceFilesPerProjectCap(
  organizationId: string,
  projectId: string,
): Promise<void> {
  const planCode = await getOrgPlanCode(organizationId);
  const limit = getPlanLimits(planCode).filesPerProject;
  if (limit === null) return;

  const [{ total }] = await db
    .select({ total: count() })
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId));

  if (total >= limit) {
    throw new PlanLimitError(
      `This project has reached the ${limit}-file limit on your current plan. Upgrade to upload more files.`,
    );
  }
}

// ─── Monthly usage checks ─────────────────────────────────────────────────────

export type UsageWarning = { message: string; percent: number } | null;

async function enforceMonthlyLimit(
  organizationId: string,
  featureKey: "tasks_created" | "comments_created" | "files_uploaded",
): Promise<UsageWarning> {
  const planCode = await getOrgPlanCode(organizationId);
  const limitsMap = getPlanLimits(planCode);

  const limitByKey = {
    tasks_created: limitsMap.tasksPerMonth,
    comments_created: limitsMap.commentsPerMonth,
    files_uploaded: limitsMap.fileUploadsPerMonth,
  };

  const limit = limitByKey[featureKey];

  if (limit === null) {
    // Unlimited — increment async and continue
    incrementMonthlyUsage(organizationId, featureKey).catch(console.error);
    return null;
  }

  const usage = await checkMonthlyUsage(organizationId, featureKey, limit);

  if (usage.isBlocked) {
    const labelMap = {
      tasks_created: "monthly task",
      comments_created: "monthly comment",
      files_uploaded: "monthly file upload",
    };
    throw new PlanLimitError(
      `You've reached your ${labelMap[featureKey]} limit for this month. Upgrade your plan to continue.`,
    );
  }

  // Increment after the check passes
  incrementMonthlyUsage(organizationId, featureKey).catch(console.error);

  if (usage.isWarning) {
    return {
      message: `You've used ${usage.percent}% of your monthly limit. Upgrade soon to avoid interruptions.`,
      percent: usage.percent,
    };
  }

  return null;
}

export const enforceTaskCreationLimit = (orgId: string) =>
  enforceMonthlyLimit(orgId, "tasks_created");

export const enforceFileUploadLimit = (orgId: string) =>
  enforceMonthlyLimit(orgId, "files_uploaded");

export const enforceCommentLimit = (orgId: string) =>
  enforceMonthlyLimit(orgId, "comments_created");
