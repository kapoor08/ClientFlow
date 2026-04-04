import { notFound } from "next/navigation";
import { getAdminOrgDetail } from "@/lib/admin-data";
import { OrgDetailTabs } from "./OrgDetailTabs";

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminOrgDetail(id);
  if (!detail) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{detail.org.name}</h1>
        <p className="font-mono text-xs text-muted-foreground mt-0.5">{detail.org.slug}</p>
      </div>
      <OrgDetailTabs detail={detail} />
    </div>
  );
}
