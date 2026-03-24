export type PlanCode = "free" | "starter" | "professional" | "enterprise";

export interface PlanLimits {
  clients: number | null;
  projects: number | null;
  teamMembers: number | null;
  filesPerProject: number | null;
  tasksPerMonth: number | null;
  commentsPerMonth: number | null;
  fileUploadsPerMonth: number | null;
}

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: {
    clients: 5,
    projects: 3,
    teamMembers: 2,
    filesPerProject: 5,
    tasksPerMonth: 20,
    commentsPerMonth: 30,
    fileUploadsPerMonth: 10,
  },
  starter: {
    clients: 15,
    projects: 10,
    teamMembers: 5,
    filesPerProject: 15,
    tasksPerMonth: 100,
    commentsPerMonth: 200,
    fileUploadsPerMonth: 50,
  },
  professional: {
    clients: null,
    projects: null,
    teamMembers: null,
    filesPerProject: null,
    tasksPerMonth: null,
    commentsPerMonth: null,
    fileUploadsPerMonth: null,
  },
  enterprise: {
    clients: null,
    projects: null,
    teamMembers: null,
    filesPerProject: null,
    tasksPerMonth: null,
    commentsPerMonth: null,
    fileUploadsPerMonth: null,
  },
};

// hrefs that are accessible per plan — null means all
export const PLAN_MODULE_HREFS: Record<PlanCode, string[] | null> = {
  free: [
    "/dashboard",
    "/clients",
    "/projects",
    "/tasks",
    "/files",
    "/activity-logs",
    "/notifications",
    "/billing",
  ],
  starter: [
    "/dashboard",
    "/clients",
    "/projects",
    "/tasks",
    "/files",
    "/activity-logs",
    "/notifications",
    "/billing",
    "/invitations",
    "/settings",
    "/teams",
  ],
  professional: null,
  enterprise: null,
};

export function getPlanLimits(planCode: string): PlanLimits {
  return PLAN_LIMITS[planCode as PlanCode] ?? PLAN_LIMITS.free;
}

export function canAccessHref(planCode: string, href: string): boolean {
  const allowed = PLAN_MODULE_HREFS[planCode as PlanCode] ?? PLAN_MODULE_HREFS.free;
  if (allowed === null) return true;
  return allowed.some((h) => href.startsWith(h));
}
