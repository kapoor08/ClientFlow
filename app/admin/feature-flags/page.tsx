import { PageHeader } from "@/components/ui/page-header";
import { FeatureFlagsTable } from "@/components/admin/feature-flags";
import { listFeatureFlagsForAdmin } from "@/server/admin/feature-flags";

export default async function Page() {
  const rows = await listFeatureFlagsForAdmin();

  return (
    <div>
      <PageHeader
        title="Feature flags"
        description="Two-tier evaluation: per-org overrides win over the global default. Unseeded keys still resolve to off until you toggle them once."
      />
      <FeatureFlagsTable rows={rows} />
    </div>
  );
}
