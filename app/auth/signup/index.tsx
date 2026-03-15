"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  useSignUp,
  validatePassword,
} from "@/core/auth";
import GooogleIcon from "@/assets/GoogleIcon";

const SignUp = () => {
  const router = useRouter();
  const signUp = useSignUp();
  const googleSignIn = useGoogleSignIn();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Complete your name and email before continuing.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signUp.mutateAsync({
        firstName,
        lastName,
        email,
        password,
        callbackURL: authRoutes.signIn,
      });
      router.push(
        `${authRoutes.verifyEmail}?email=${encodeURIComponent(email.trim())}`,
      );
      router.refresh();
    } catch (currentError) {
      setError(getAuthErrorMessage(currentError, "Unable to create account."));
    }
  }

  async function handleGoogleSignUp() {
    setError(null);

    try {
      await googleSignIn.mutateAsync(authRoutes.dashboard);
    } catch (currentError) {
      setError(
        getAuthErrorMessage(currentError, "Unable to continue with Google."),
      );
    }
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      description="Set up your agency workspace in a few minutes."
      panelTitle="Start your free trial"
      panelDescription="Create your workspace, invite your team, and begin managing projects and clients from day one."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error ? <AuthNotice tone="error" message={error} /> : null}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleGoogleSignUp}
          disabled={signUp.isPending || googleSignIn.isPending}
        >
          <GooogleIcon className="mr-2 h-4 w-4" />
          {googleSignIn.isPending ? "Redirecting..." : "Continue with Google"}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="Jane"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@agency.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Passwords must be at least 8 characters and include uppercase,
          lowercase, and numeric characters.
        </p>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={signUp.isPending || googleSignIn.isPending}
        >
          {signUp.isPending ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={authRoutes.signIn}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
};

export default SignUp;
