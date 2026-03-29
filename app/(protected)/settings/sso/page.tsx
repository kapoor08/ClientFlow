"use client";

import { useState } from "react";
import {
  Shield, Loader2, Check, ExternalLink, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SsoConfig = {
  enabled: boolean;
  providerType: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  entityId: string;
};

const DEFAULT_CONFIG: SsoConfig = {
  enabled: false,
  providerType: "oidc",
  discoveryUrl: "",
  clientId: "",
  clientSecret: "",
  entityId: "",
};

export default function SsoPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState<SsoConfig>(DEFAULT_CONFIG);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ssoData } = useQuery<{ ssoConfig: SsoConfig | null }>({
    queryKey: ["sso-config"],
    queryFn: () => fetch("/api/settings/sso").then((r) => r.json()),
  });

  // Hydrate local state once when remote config loads
  if (ssoData?.ssoConfig && !initialized) {
    setConfig({ ...DEFAULT_CONFIG, ...ssoData.ssoConfig });
    setInitialized(true);
  }

  // We'll use the mutation for save
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
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Single Sign-On
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure OIDC or SAML-based SSO for your organization.
        </p>
      </div>

      {/* Enterprise notice */}
      <div className="rounded-card border border-info/30 bg-info/5 p-4">
        <div className="flex items-start gap-3">
          <Info size={15} className="mt-0.5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-medium text-foreground">Enterprise Feature</p>
            <p className="mt-1 text-xs text-muted-foreground">
              SSO enforcement requires server-side middleware configuration. Save your
              settings here and contact support to activate enforcement on your domain.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Config form */}
      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">SSO Configuration</h2>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Enable SSO</p>
            <p className="text-xs text-muted-foreground">
              Require organization members to sign in via SSO.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update("enabled", !config.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.enabled ? "bg-primary" : "bg-secondary"}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${config.enabled ? "translate-x-4.5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {/* Provider type */}
        <div className="space-y-2">
          <Label>Provider Type</Label>
          <Select
            value={config.providerType}
            onValueChange={(v) => update("providerType", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oidc">OpenID Connect (OIDC)</SelectItem>
              <SelectItem value="saml">SAML 2.0</SelectItem>
              <SelectItem value="google">Google Workspace</SelectItem>
              <SelectItem value="azure">Azure Active Directory</SelectItem>
              <SelectItem value="okta">Okta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.providerType === "oidc" || config.providerType === "google" || config.providerType === "azure" || config.providerType === "okta" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="discovery-url">Discovery / Well-Known URL</Label>
              <Input
                id="discovery-url"
                value={config.discoveryUrl}
                onChange={(e) => update("discoveryUrl", e.target.value)}
                placeholder="https://your-provider/.well-known/openid-configuration"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={config.clientId}
                  onChange={(e) => update("clientId", e.target.value)}
                  placeholder="your-client-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => update("clientSecret", e.target.value)}
                  placeholder="your-client-secret"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="entity-id">SP Entity ID</Label>
              <Input
                id="entity-id"
                value={config.entityId}
                readOnly
                placeholder="Will be generated after save"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idp-url">Identity Provider SSO URL</Label>
              <Input
                id="idp-url"
                value={config.discoveryUrl}
                onChange={(e) => update("discoveryUrl", e.target.value)}
                placeholder="https://idp.example.com/sso/saml"
              />
            </div>
          </>
        )}

        {/* Callback URL display */}
        <div className="space-y-2">
          <Label>Callback URL (for your Identity Provider)</Label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="flex-1 truncate">
              {typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}
              /api/auth/callback/sso
            </span>
            <ExternalLink size={12} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={14} className="mr-1.5" /> Saved</>
            ) : (
              "Save Configuration"
            )}
          </Button>

          {config.enabled && config.clientId && config.discoveryUrl && (
            <a
              href={`/api/auth/sso/initiate?org=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={13} />
              Test SSO Login
            </a>
          )}
        </div>

        {config.enabled && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-success font-medium">
              SSO enforcement active — members will be redirected to your IdP on sign-in
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
