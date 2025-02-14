import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import logger from "./logger";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_BUCKET_NAME!;

interface FileUploadResult {
  key: string;
  presignedUrl: string;
}

/**
 * Uploads a file to S3 and returns the file key and presigned URL
 */
export const uploadToS3 = async (
  file: Express.Multer.File,
  userId: string
): Promise<FileUploadResult> => {
  try {
    // Generate a unique key for the file
    const fileExtension =
      file.originalname.split(".").pop()?.toLowerCase() || "";
    const randomString = crypto.randomBytes(8).toString("hex");
    const key = `${userId}/${randomString}.${fileExtension}`;

    // Upload file to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: `inline; filename="${file.originalname}"`,
      Metadata: {
        "original-name": file.originalname,
        "upload-date": new Date().toISOString(),
        "user-id": userId,
      },
    });

    await s3Client.send(uploadCommand);

    // Generate presigned URL for the uploaded file
    const presignedUrl = await getPresignedUrl(key);

    return {
      key,
      presignedUrl,
    };
  } catch (error) {
    logger.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

/**
 * Generates a presigned URL for accessing a file in S3
 * URL expires in 1 hour by default
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn, // URL expires in 1 hour
    });

    return presignedUrl;
  } catch (error) {
    logger.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from storage");
  }
};

export const generatePresignedUrl = async (key: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  } catch (error) {
    logger.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate file access URL");
  }
};
