import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

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

export const uploadToS3 = async (
  file: Express.Multer.File,
  userId: string
): Promise<FileUploadResult> => {
  try {
    const fileExtension =
      file.originalname.split(".").pop()?.toLowerCase() || "";
    const key = `${userId}/${uuidv4()}.${fileExtension}`;

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

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    }); // 1 hour

    return {
      key,
      presignedUrl,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to storage");
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
    console.error("Error deleting file from S3:", error);
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
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate file access URL");
  }
};
