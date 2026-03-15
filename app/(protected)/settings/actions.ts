"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/get-session";
import { updateOrganizationSettingsForUser } from "@/lib/organization-settings";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateOrganizationSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      status: "error",
      message: "You must be signed in to update organization settings.",
    };
  }

  try {
    await updateOrganizationSettingsForUser(session.user.id, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
      currencyCode: String(formData.get("currencyCode") ?? ""),
      requireEmailVerification:
        String(formData.get("requireEmailVerification") ?? "false") === "true",
    });

    revalidatePath("/settings");

    return {
      status: "success",
      message: "Organization settings updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to update organization settings.",
    };
  }
}
