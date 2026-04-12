"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import {
  updateOrganizationSettingsForUser,
  completeOnboardingForUser,
} from "@/server/organization-settings";
import { organizationProfileSchema } from "@/schemas/onboarding";

export type OnboardingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveOrganizationProfileAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await getServerSession();
  if (!session?.user) {
    return { status: "error", message: "Not authenticated." };
  }

  const parsed = organizationProfileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? "UTC"),
    currencyCode: String(formData.get("currencyCode") ?? "USD"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      message: first?.message ?? "Please review the form and try again.",
    };
  }

  try {
    await updateOrganizationSettingsForUser(session.user.id, {
      ...parsed.data,
      requireEmailVerification: false,
    });
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to save.",
    };
  }

  redirect("/onboarding/workspace");
}

export async function skipToCompleteAction(): Promise<never> {
  redirect("/onboarding/complete");
}

export async function finishOnboardingAction(): Promise<never> {
  const session = await getServerSession();
  if (session?.user) {
    await completeOnboardingForUser(session.user.id);
  }
  redirect("/dashboard");
}
