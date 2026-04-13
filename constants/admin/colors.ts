export const ADMIN_PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

export const ADMIN_SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-brand-100 text-primary",
  past_due: "bg-warning/10 text-warning",
  canceled: "bg-secondary text-muted-foreground",
};

export const ADMIN_INVITATION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  revoked: "bg-secondary text-muted-foreground",
  expired: "bg-danger/10 text-danger",
};

export const ADMIN_API_KEY_STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  revoked: "bg-secondary text-muted-foreground",
  expired: "bg-danger/10 text-danger",
};
