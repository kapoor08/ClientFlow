"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import {
  updateOrganizationSettingsForUser,
  completeOnboardingForUser,
} from "@/lib/organization-settings";

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

  try {
    await updateOrganizationSettingsForUser(session.user.id, {
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      timezone: String(formData.get("timezone") ?? "UTC"),
      currencyCode: String(formData.get("currencyCode") ?? "USD"),
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
