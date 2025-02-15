import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import {
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
    options: { method?: string; headers?: any; data?: any } = {}
  ): Promise<T> {
    try {
      const headers = {
        "x-api-key": this.apiKey,
        ...options.headers,
      };

      const response = await axios({
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || "GET",
        headers,
        data: options.data,
      });

      return response.data as T;
    } catch (error: any) {
      logger.error("Version API error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new BadRequestError(
        error.response?.data?.message || "Version service error"
      );
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

    // Create a read stream from the temp file
    const fileStream = fs.createReadStream(file.path);
    formData.append("file", fileStream, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: file.size,
    });

    if (versionNumber) {
      formData.append("versionNumber", versionNumber.toString());
    }

    try {
      const response = await this.fetchApi<CreateVersionResponse>(
        `/versions/${documentId}`,
        {
          method: "POST",
          headers: {
            ...formData.getHeaders(),
            "x-api-key": this.apiKey,
          },
          data: formData,
        }
      );

      // Clean up temp file after successful upload
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkError: any) {
        logger.error("Error cleaning up temp file:", {
          message: unlinkError.message,
          path: file.path,
        });
      }

      return response;
    } catch (error: any) {
      // Clean up temp file in case of error
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkError: any) {
        logger.error("Error cleaning up temp file:", {
          message: unlinkError.message,
          path: file.path,
        });
      }
      throw new BadRequestError(
        error.response?.data?.message || "Failed to create version"
      );
    }
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
  process.env.VERSION_SERVICE_URL || "http://localhost:5003"
);
