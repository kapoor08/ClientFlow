"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledInput } from "@/components/form";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import AuthNotice from "@/components/auth/AuthNotice";
import { authRoutes } from "@/core/auth";

const ERROR_MESSAGES: Record<string, string> = {
  sso_not_configured: "SSO is not configured for this email domain. Contact your administrator.",
  sso_discovery_failed: "Could not reach the identity provider. Try again or contact your admin.",
  state_mismatch: "SSO session expired. Please try again.",
  idp_error: "The identity provider returned an error. Contact your administrator.",
  callback_failed: "Sign-in failed during the callback. Please try again.",
  no_email: "The identity provider did not return an email address.",
  missing_params: "Invalid SSO response. Please try again.",
};

const REASON_MESSAGES: Record<string, string> = {
  sso_required: "Your organization requires SSO. Please sign in through your identity provider.",
};

const ssoSchema = z.object({
  email: z.string().email({ message: "Enter a valid work email address." }),
});

type SsoFormValues = z.infer<typeof ssoSchema>;

const SsoPage = () => {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const reasonKey = searchParams.get("reason");
  const prefillEmail = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SsoFormValues>({
    resolver: zodResolver(ssoSchema),
    defaultValues: { email: prefillEmail },
  });

  const onSubmit = (values: SsoFormValues) => {
    setLoading(true);
    // Redirect to the initiate endpoint — the browser follows the redirect chain
    window.location.href = `/api/auth/sso/initiate?email=${encodeURIComponent(values.email.trim())}`;
  };

  return (
    <AuthSplitLayout
      title="Sign in with SSO"
      description="Enter your work email to continue via your organization's identity provider."
      panelTitle="Single Sign-On"
      panelDescription="Access your ClientFlow workspace securely through your organization's identity provider."
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {reasonKey && REASON_MESSAGES[reasonKey] && (
          <AuthNotice tone="info" message={REASON_MESSAGES[reasonKey]} />
        )}
        {errorKey && (
          <AuthNotice
            tone="error"
            message={ERROR_MESSAGES[errorKey] ?? "An unexpected error occurred. Please try again."}
          />
        )}

        <ControlledInput
          name="email"
          label="Work email"
          type="email"
          control={control}
          error={errors.email}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>
              Continue with SSO
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Not using SSO?{" "}
        <Link href={authRoutes.signIn} className="font-medium text-primary hover:underline">
          Sign in with password
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default SsoPage;
