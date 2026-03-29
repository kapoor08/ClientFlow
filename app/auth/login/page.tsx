import { redirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string>> };

export default async function LoginAliasPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/auth/sign-in?${qs}` : "/auth/sign-in");
}
