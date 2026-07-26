"use client";

import AuthNotice from "@/components/auth/AuthNotice";
import AuthSplitLayout from "@/components/layout/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TwoFactorPromptProps = {
  apiError: string | null;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
  onBack: () => void;
};

/**
 * The 6-digit TOTP challenge screen shown after a password sign-in when the
 * account has 2FA enabled. Controlled: the code + verify state live in the
 * parent so the parent owns the auth mutation.
 */
export function TwoFactorPrompt({
  apiError,
  code,
  onCodeChange,
  onVerify,
  isVerifying,
  onBack,
}: TwoFactorPromptProps) {
  return (
    <AuthSplitLayout
      title="Two-factor authentication"
      description="Enter the 6-digit code from your authenticator app."
      panelTitle="Welcome back"
      panelDescription="Sign in to manage clients, projects, billing, and your internal operations from one place."
    >
      <div className="mt-6 space-y-4">
        {apiError && <AuthNotice tone="error" message={apiError} />}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="totp-code">
            Verification code
          </label>
          <Input
            id="totp-code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && code.length === 6 && onVerify()}
            placeholder="000000"
            maxLength={6}
            className="text-center font-mono text-lg tracking-widest"
            autoFocus
          />
        </div>
        <Button
          className="w-full cursor-pointer"
          onClick={onVerify}
          disabled={code.length < 6 || isVerifying}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
        <div className="text-center">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            onClick={onBack}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
