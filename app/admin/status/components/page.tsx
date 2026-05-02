import { listAdminComponents } from "@/server/admin/status-components";
import AdminStatusComponentsPage from "./index";

export default async function Page() {
  const components = await listAdminComponents();
  return <AdminStatusComponentsPage components={components} />;
}
