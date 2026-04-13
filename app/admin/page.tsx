import { getAdminDashboardStats } from "@/server/admin/dashboard";
import AdminDashboardPage from "./index";

export default async function Page() {
  const stats = await getAdminDashboardStats();
  return <AdminDashboardPage stats={stats} />;
}
