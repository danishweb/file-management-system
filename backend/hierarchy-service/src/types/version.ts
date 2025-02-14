export interface Version {
  _id: string;
  documentId: string;
  userId: string;
  versionNumber: number;
  fileKey: string;
  originalName: string;
  contentType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVersionResponse {
  id: string;
  version: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface GetAllVersionsResponse {
  versions: Array<{
    id: string;
    documentId: string;
    versionNumber: number;
    fileKey: string;
    fileUrl: string;
    createdAt: Date;
  }>;
}

export interface VersionResponse {
  id: string;
  versionNumber: number;
  fileUrl: string;
  uploadedAt: Date;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
}
