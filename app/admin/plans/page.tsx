import { getAdminPlansWithLimits } from "@/server/admin/plans";
import AdminPlansPage from "./index";

export default async function Page() {
  const plansData = await getAdminPlansWithLimits();
  return <AdminPlansPage plansData={plansData} />;
}
