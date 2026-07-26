"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SsoConfigForm } from "@/components/settings/sso/SsoConfigForm";
import { DEFAULT_SSO_CONFIG, type SsoConfig } from "@/components/settings/sso/types";

export default function SsoPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState<SsoConfig>(DEFAULT_SSO_CONFIG);
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ssoData } = useQuery<{ ssoConfig: SsoConfig | null }>({
    queryKey: ["sso-config"],
    queryFn: () => fetch("/api/settings/sso").then((r) => r.json()),
  });

  // Hydrate local state once when remote config loads
  if (ssoData?.ssoConfig && !initialized) {
    setConfig({ ...DEFAULT_SSO_CONFIG, ...ssoData.ssoConfig });
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/sso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssoConfig: config }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Save failed.");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sso-config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("SSO configuration saved.");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      toast.error(message);
    },
  });

  function update(key: keyof SsoConfig, value: string | boolean) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-foreground text-2xl font-semibold">Single Sign-On</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure OIDC or SAML-based SSO for your organization.
        </p>
      </div>

      {/* Enterprise notice */}
      <div className="rounded-card border-info/30 bg-info/5 border p-4">
        <div className="flex items-start gap-3">
          <Info size={15} className="text-info mt-0.5 shrink-0" />
          <div>
            <p className="text-foreground text-sm font-medium">Enterprise Feature</p>
            <p className="text-muted-foreground mt-1 text-xs">
              SSO enforcement requires server-side middleware configuration. Save your settings here
              and contact support to activate enforcement on your domain.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-card border-danger/20 bg-danger/5 text-danger border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <SsoConfigForm
        config={config}
        onUpdate={update}
        onSave={() => saveMutation.mutate()}
        isSaving={saveMutation.isPending}
        saved={saved}
      />
    </div>
  );
}
