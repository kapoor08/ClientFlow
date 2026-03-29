"use client";

import { Shield } from "lucide-react";
import { useSessions } from "@/core/security/useCase";
import { useAuthSession } from "@/core/auth/useCase";
import { MfaSection } from "./MfaSection";
import { SecurityPoliciesSection } from "./SecurityPoliciesSection";
import { SessionsSection } from "./SessionsSection";

const SecurityPage = () => {
  const { data, isLoading } = useSessions();
  const { data: sessionData } = useAuthSession();
  const mfaEnabled = !!(sessionData?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled;

  const sessions = data?.sessions ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Security
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your active sessions and devices
        </p>
      </div>

      {/* MFA */}
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        Authentication
      </h2>
      <MfaSection mfaEnabled={mfaEnabled} />

      {/* Security Policies */}
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        Organization Policies
      </h2>
      <SecurityPoliciesSection />

      {/* Active Sessions */}
      <SessionsSection sessions={sessions} isLoading={isLoading} />

      {/* Security note */}
      <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
        <div className="flex items-start gap-3">
          <Shield size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Keep your account safe
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If you see a session you don't recognize, revoke it immediately and consider
              changing your password. Each device shows the last known IP address and
              approximate activity time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
