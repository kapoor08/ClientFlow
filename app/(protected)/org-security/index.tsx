"use client";

import { Shield } from "lucide-react";
import { useSessions } from "@/core/security/useCase";
import { useAuthSession } from "@/core/auth/useCase";
import {
  MfaSection,
  SecurityPoliciesSection,
  SessionsSection,
  DeleteAccountSection,
} from "@/components/security";

const SecurityPage = () => {
  const { data, isLoading } = useSessions();
  const { data: sessionData } = useAuthSession();
  const mfaEnabled = !!(sessionData?.user as { twoFactorEnabled?: boolean } | undefined)
    ?.twoFactorEnabled;

  const sessions = data?.sessions ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">Security</h1>
        <p className="text-muted-foreground text-sm">Manage your active sessions and devices</p>
      </div>

      {/* MFA */}
      <h2 className="font-display text-foreground mb-3 text-lg font-semibold">Authentication</h2>
      <MfaSection mfaEnabled={mfaEnabled} />

      {/* Security Policies */}
      <h2 className="font-display text-foreground mb-3 text-lg font-semibold">
        Organization Policies
      </h2>
      <SecurityPoliciesSection />

      {/* Active Sessions */}
      <SessionsSection sessions={sessions} isLoading={isLoading} />

      {/* Security note */}
      <div className="rounded-card border-border bg-card shadow-cf-1 border p-4">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-foreground text-sm font-medium">Keep your account safe</p>
            <p className="text-muted-foreground mt-1 text-xs">
              If you see a session you don&apos;t recognize, revoke it immediately and consider
              changing your password. Each device shows the last known IP address and approximate
              activity time.
            </p>
          </div>
        </div>
      </div>

      {/* Danger zone - self-service deletion */}
      <div className="mt-8">
        <h2 className="font-display text-foreground mb-3 text-lg font-semibold">Danger zone</h2>
        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default SecurityPage;
