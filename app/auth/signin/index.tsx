"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authRoutes,
  getAuthErrorMessage,
  useGoogleSignIn,
  useSignIn,
} from "@/core/auth";
import { toast } from "sonner";
import GooogleIcon from "@/assets/GoogleIcon";

const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || authRoutes.dashboard;

  const signIn = useSignIn();
  const googleSignIn = useGoogleSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }

    try {
      await signIn.mutateAsync({
        email,
        password,
        callbackURL: redirectTo,
      });
      toast.success("Signed in successfully.");
      router.push(redirectTo);
      router.refresh();
    } catch (currentError) {
      setError(getAuthErrorMessage(currentError, "Unable to sign in."));
    }
  }

  async function handleGoogleSignIn() {
    setError(null);

    try {
      await googleSignIn.mutateAsync(redirectTo);
    } catch (currentError) {
      setError(
        getAuthErrorMessage(currentError, "Unable to continue with Google.")
      );
    }
  }

  return (
    <AuthSplitLayout
      title="Sign in"
      description="Enter your credentials to access your account."
      panelTitle="Welcome back"
      panelDescription="Sign in to manage clients, projects, billing, and your internal operations from one place."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error ? <AuthNotice tone="error" message={error} /> : null}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleGoogleSignIn}
          disabled={signIn.isPending || googleSignIn.isPending}
        >
          <GooogleIcon className="mr-2 h-4 w-4" />
          {googleSignIn.isPending ? "Redirecting..." : "Continue with Google"}
        </Button>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={authRoutes.forgotPassword}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signIn.isPending || googleSignIn.isPending}
        >
          {signIn.isPending ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={redirectTo && redirectTo !== authRoutes.dashboard ? `${authRoutes.signUp}?redirectTo=${encodeURIComponent(redirectTo)}` : authRoutes.signUp}
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/auth/sso"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in with SSO →
        </Link>
      </div>
    </AuthSplitLayout>
  );
};

export default SignIn;
