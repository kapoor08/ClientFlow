export type SsoConfig = {
  enabled: boolean;
  providerType: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  entityId: string;
};

export const DEFAULT_SSO_CONFIG: SsoConfig = {
  enabled: false,
  providerType: "oidc",
  discoveryUrl: "",
  clientId: "",
  clientSecret: "",
  entityId: "",
};
