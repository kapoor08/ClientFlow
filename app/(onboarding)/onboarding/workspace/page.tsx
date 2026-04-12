import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { Users } from "lucide-react";
import { WorkspaceStepForm } from "@/components/forms/onboarding";

export default async function OnboardingWorkspacePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step <= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step < 2 ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
        <span className="ml-3 text-xs text-muted-foreground">Step 2 of 3</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Users size={20} className="text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Invite your team
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add teammates so you can collaborate right away. You can invite more people later from the Invitations page.
        </p>
      </div>

      <WorkspaceStepForm />
    </div>
  );
}
