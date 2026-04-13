import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/server/admin/users";
import AdminUserDetailPage from "./index";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();
  return <AdminUserDetailPage detail={detail} />;
}
