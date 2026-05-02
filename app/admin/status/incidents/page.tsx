import { listAdminIncidents } from "@/server/admin/status-incidents";
import { listAdminComponents } from "@/server/admin/status-components";
import AdminIncidentsPage from "./index";

export default async function Page() {
  const [incidents, components] = await Promise.all([listAdminIncidents(), listAdminComponents()]);
  return <AdminIncidentsPage incidents={incidents} components={components} />;
}
