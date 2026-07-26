// Shared types for the task-detail feature components.

export type MemberOption = {
  userId: string;
  name: string;
  email: string;
  roleName?: string;
};

export type PreviewFile = {
  id: string; // attachment DB id - used by the proxy route
  src: string; // original Cloudinary URL (used for images/video/audio)
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};
