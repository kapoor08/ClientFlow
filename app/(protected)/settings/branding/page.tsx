import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { BrandingForm } from "@/components/settings";

export default async function BrandingPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your organization&apos;s logo and brand color.
        </p>
      </div>

      <BrandingForm
        defaultLogoUrl={ctx.logoUrl ?? ""}
        defaultBrandColor={ctx.brandColor ?? "#6366f1"}
        canManage={ctx.canManageSettings}
      />
    </div>
  );
}
