import {
  ApiErrorResponse,
  CreateVersionResponse,
  GetAllVersionsResponse,
} from "../types/version";
import { BadRequestError } from "../utils/errors";
import logger from "../utils/logger";

export class VersionApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Get API key from environment
    const apiKey = process.env.VERSION_SERVICE_API_KEY;
    if (!apiKey) {
      throw new Error("VERSION_SERVICE_API_KEY is not configured");
    }
    this.apiKey = apiKey;
  }

  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Add API key to headers
      const headers = {
        ...options.headers,
        "x-api-key": this.apiKey,
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiErrorResponse;
        throw new BadRequestError(error.message || "Version service error");
      }

      return data as T;
    } catch (error) {
      logger.error("Version API error:", error);
      throw error;
    }
  }

  public async getAllVersions(
    documentId: string
  ): Promise<GetAllVersionsResponse> {
    return this.fetchApi<GetAllVersionsResponse>(`/versions/${documentId}`);
  }

  public async createVersion(
    documentId: string,
    file: Express.Multer.File,
    versionNumber?: number
  ): Promise<CreateVersionResponse> {
    const formData = new FormData();
    formData.append("file", new Blob([file.buffer]), file.originalname);
    if (versionNumber)
      formData.append("versionNumber", versionNumber.toString());

    return this.fetchApi<CreateVersionResponse>(`/versions/${documentId}`, {
      method: "POST",
      body: formData,
    });
  }

  public async deleteVersions(documentId: string): Promise<void> {
    try {
      await this.fetchApi<void>(`/versions/${documentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      throw new BadRequestError("Failed to delete versions");
    }
  }
}

// Export singleton instance
export const versionApi = new VersionApiService(
  process.env.VERSION_SERVICE_URL || "http://localhost:9002"
);
