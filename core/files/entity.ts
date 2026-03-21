export type OrgFileListItem = {
  id: string;
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string | null;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export type OrgFileListResponse = {
  files: OrgFileListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type ProjectFile = {
  id: string;
  projectId: string;
  storageKey: string;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string; // ISO string from JSON
};

export type FileListResponse = {
  files: ProjectFile[];
};

export type SaveFileInput = {
  projectId: string;
  storageKey: string;
  storageUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export type FileMutationResponse = {
  fileId: string;
};

export type SignedUploadParams = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};
