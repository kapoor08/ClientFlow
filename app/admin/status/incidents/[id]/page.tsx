import { notFound } from "next/navigation";
import { getAdminIncidentById } from "@/server/admin/status-incidents";
import { listAdminComponents } from "@/server/admin/status-components";
import AdminIncidentDetailPage from "./index";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, components] = await Promise.all([getAdminIncidentById(id), listAdminComponents()]);
  if (!detail) notFound();

  return <AdminIncidentDetailPage detail={detail} components={components} />;
}
