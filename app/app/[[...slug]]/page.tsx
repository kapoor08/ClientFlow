import { redirect } from "next/navigation";

export default async function LegacyAppRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    redirect("/dashboard");
  }

  redirect(`/${slug.join("/")}`);
}
