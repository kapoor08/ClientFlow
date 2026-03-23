import { http } from "@/core/infrastructure";
import type { DashboardContext } from "./entity";

export async function fetchDashboardContext(): Promise<DashboardContext> {
  return http<DashboardContext>("/api/dashboard");
}
