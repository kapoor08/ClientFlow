export const CLIENT_NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "meeting", label: "Meeting" },
  { value: "follow_up", label: "Follow-up" },
  { value: "internal", label: "Internal" },
  { value: "requirement", label: "Requirement" },
] as const;

export type ClientNoteTypeValue = (typeof CLIENT_NOTE_TYPES)[number]["value"];

export type ClientNote = {
  id: string;
  clientId: string;
  organizationId: string;
  type: string;
  content: string;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
