import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import {
  CheckCircle2,
  FolderKanban,
  Users,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { finishOnboardingAction } from "@/server/actions/onboarding";

const quickLinks = [
  {
    icon: FolderKanban,
    label: "Create a Project",
    description: "Start tracking work for a client",
    href: "/projects/new",
  },
  {
    icon: Users,
    label: "Add a Client",
    description: "Bring your first client into ClientFlow",
    href: "/clients/new",
  },
  {
    icon: CheckSquare,
    label: "Create a Task",
    description: "Add your first task to a project",
    href: "/tasks",
  },
];

export default async function OnboardingCompletePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="text-center">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {step < 3 && <div className="h-px w-8 bg-primary/40" />}
          </div>
        ))}
        <span className="ml-3 text-xs text-muted-foreground">Complete</span>
      </div>

      {/* Hero */}
      <div className="mb-10">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
            <CheckCircle2 size={32} className="text-success" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          You&apos;re all set, {firstName}!
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {ctx?.organizationName
            ? `${ctx.organizationName} is ready to go.`
            : "Your workspace is ready."}{" "}
          Here are a few things to get started with.
        </p>
      </div>

      {/* Quick links */}
      <div className="mb-10 grid gap-3 text-left">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 rounded-card border border-border bg-card px-5 py-4 shadow-cf-1 hover:border-primary/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <item.icon size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors"
            />
          </Link>
        ))}
      </div>

      {/* CTA */}
      <form action={finishOnboardingAction}>
        <Button size="lg" type="submit" className="w-full cursor-pointer">
          Go to Dashboard <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}
