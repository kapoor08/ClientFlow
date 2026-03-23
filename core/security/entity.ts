export type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type SessionsResponse = {
  sessions: SessionItem[];
};
