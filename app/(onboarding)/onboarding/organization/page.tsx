import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import OrganizationStepForm from "./OrganizationStepForm";
import { Building2 } from "lucide-react";

export default async function OnboardingOrganizationPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
        <span className="ml-3 text-xs text-muted-foreground">Step 1 of 3</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Building2 size={20} className="text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Set up your organization
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about your agency or team. You can always update this later in settings.
        </p>
      </div>

      {/* Form */}
      <OrganizationStepForm
        defaultName={ctx?.organizationName ?? ""}
        defaultSlug={ctx?.organizationSlug ?? ""}
        defaultTimezone={ctx?.timezone ?? "UTC"}
        defaultCurrency={ctx?.currencyCode ?? "USD"}
      />
    </div>
  );
}
