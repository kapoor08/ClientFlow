"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/get-session";
import { updateOrganizationBrandingForUser } from "@/lib/organization-settings";

export async function saveBrandingAction(input: {
  logoUrl: string | null;
  brandColor: string | null;
}): Promise<{ logoUrl: string | null; brandColor: string | null }> {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized.");

  const saved = await updateOrganizationBrandingForUser(session.user.id, {
    logoUrl: input.logoUrl,
    brandColor: input.brandColor,
  });

  revalidatePath("/", "layout");

  return saved;
}
