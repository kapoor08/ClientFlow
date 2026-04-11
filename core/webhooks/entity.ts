export type WebhookItem = {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

export type WebhookListResponse = {
  webhooks: WebhookItem[];
};

export type CreateWebhookInput = {
  name: string;
  url: string;
  events: string[];
};

export type UpdateWebhookInput = {
  isActive?: boolean;
  name?: string;
  url?: string;
  events?: string[];
};
