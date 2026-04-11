/**
 * Task-related display helpers.
 */

type EstimateTask = {
  status: string;
  estimateMinutes: number | null;
  estimateSetAt: Date | string | null;
  createdAt: Date | string;
};

/**
 * Returns a Tailwind text color class indicating how close a task is
 * to its time estimate. Empty string means "no signal".
 *
 * - "" - no estimate, or well within budget
 * - text-warning - 75%+ of estimate elapsed
 * - text-danger - estimate exceeded
 * - text-success - task is done
 */
export function getEstimateColor(task: EstimateTask): string {
  if (!task.estimateMinutes) return "";
  if (task.status === "done") return "text-success";

  const baseline = task.estimateSetAt
    ? new Date(task.estimateSetAt).getTime()
    : new Date(task.createdAt).getTime();
  const elapsedMs = Date.now() - baseline;
  const estimateMs = task.estimateMinutes * 60 * 1000;

  if (elapsedMs >= estimateMs) return "text-danger";
  if (elapsedMs >= estimateMs * 0.75) return "text-warning";
  return "";
}
