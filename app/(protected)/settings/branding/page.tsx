import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { BrandingForm } from "@/components/settings";
import { DEFAULT_BRAND_COLOR } from "@/constants/colors";

export default async function BrandingPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">Branding</h1>
        <p className="text-muted-foreground text-sm">
          Customize your organization&apos;s logo and brand color.
        </p>
      </div>

      <BrandingForm
        defaultLogoUrl={ctx.logoUrl ?? ""}
        defaultBrandColor={ctx.brandColor ?? DEFAULT_BRAND_COLOR}
        canManage={ctx.canManageSettings}
      />
    </div>
  );
}
