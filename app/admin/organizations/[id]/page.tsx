import { notFound } from "next/navigation";
import { getAdminOrgDetail } from "@/server/admin/organizations";
import AdminOrgDetailPage from "./index";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminOrgDetail(id);
  if (!detail) notFound();
  return <AdminOrgDetailPage detail={detail} />;
}
