import { NextFunction, Request, Response } from "express";
import { Version } from "../models/Version";
import { BadRequestError } from "../utils/errors";
import logger from "../utils/logger";
import { uploadToS3, getPresignedUrl, deleteFromS3 } from "../utils/s3";

// Get all versions of a document
export const getAllVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const versions = await Version.find({ documentId: id })
      .sort({ versionNumber: -1 })
      .select("versionNumber fileKey createdAt")
      .lean();

    // Generate presigned URLs for all versions
    const versionsWithUrls = await Promise.all(
      versions.map(async (version) => {
        const presignedUrl = await getPresignedUrl(version.fileKey);
        return {
          version: version.versionNumber.toFixed(1),
          fileUrl: presignedUrl,
          uploadedAt: version.createdAt,
        };
      })
    );

    return res.status(200).json({
      versions: versionsWithUrls
    });
  } catch (error) {
    logger.error("Error fetching versions:", error);
    next(error);
  }
};

// Create new version of a document
export const createVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { versionNumber } = req.body;
    const file = req.file;

    if (!file) {
      throw new BadRequestError("No file uploaded");
    }

    let newVersionNumber: number;

    if (versionNumber) {
      const versionNum = parseFloat(versionNumber);

      if (isNaN(versionNum) || !Number.isFinite(versionNum)) {
        throw new BadRequestError("Invalid version number format");
      }

      const existingVersion = await Version.findOne({
        documentId: id,
        versionNumber: versionNum,
      });

      if (existingVersion) {
        throw new BadRequestError(
          `Version ${versionNum} already exists for this document`
        );
      }

      const isValid = await Version.validateVersionNumber(id!, versionNum);
      if (!isValid) {
        throw new BadRequestError(
          "Invalid version number. Must be next minor version (e.g., 1.0 -> 1.1) or next major version (e.g., 1.9 -> 2.0)"
        );
      }

      newVersionNumber = versionNum;
    } else {
      const latestVersionNumber = await Version.getLatestVersionNumber(id!);

      if (latestVersionNumber === 0) {
        newVersionNumber = 1.0;
      } else {
        const major = Math.floor(latestVersionNumber);
        const minor = parseInt(
          (latestVersionNumber % 1).toFixed(1).substring(2)
        );

        if (minor === 9) {
          newVersionNumber = major + 1.0;
        } else {
          newVersionNumber = major + (minor + 1) / 10;
        }
      }
    }

    const { key, presignedUrl } = await uploadToS3(file, id!);

    // Create new version
    const version = await Version.create({
      documentId: id,
      versionNumber: newVersionNumber,
      fileKey: key,
      mimeType: file.mimetype,
      size: file.size,
    });

    return res.status(201).json({
      id: version.documentId,
      version: version.versionNumber.toFixed(1),
      fileUrl: presignedUrl,
      uploadedAt: version.createdAt,
    });
  } catch (error) {
    logger.error("Error creating version:", error);
    next(error);
  }
};

// Delete all versions of a document
export const deleteVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Find all versions to get their fileKeys
    const versions = await Version.find({ documentId: id });
    
    // Delete files from S3
    await Promise.all(
      versions.map(async (version) => {
        try {
          // Delete file from S3
          await deleteFromS3(version.fileKey);
        } catch (error) {
          logger.error(`Error deleting file ${version.fileKey} from S3:`, error);
          // Continue with other deletions even if one fails
        }
      })
    );

    // Delete all versions from database
    await Version.deleteMany({ documentId: id });

    return res.status(200).json({
      message: `Successfully deleted all versions for document ${id}`
    });
  } catch (error) {
    logger.error("Error deleting versions:", error);
    next(error);
  }
};
