"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authRoutes, useSignOut } from "@/core/auth";

export default function SignOutButton() {
  const router = useRouter();
  const signOut = useSignOut();

  async function handleSignOut() {
    try {
      await signOut.mutateAsync();
      router.push(authRoutes.signIn);
      router.refresh();
    } catch {
      router.push(authRoutes.signIn);
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 cursor-pointer"
      onClick={handleSignOut}
      disabled={signOut.isPending}
    >
      <LogOut size={16} />
      {signOut.isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
