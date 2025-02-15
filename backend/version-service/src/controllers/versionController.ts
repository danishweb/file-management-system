import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { Version } from "../models/Version";
import { BadRequestError } from "../utils/errors";
import { deleteFile, getFileUrl } from "../utils/fileStorage";
import logger from "../utils/logger";

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

    // Generate URLs for all versions
    const versionsWithUrls = versions.map((version) => ({
      version: version.versionNumber.toFixed(1),
      fileUrl: getFileUrl(version.fileKey),
      uploadedAt: version.createdAt,
    }));

    return res.status(200).json({
      versions: versionsWithUrls,
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
    const { id: documentId } = req.params;
    const { versionNumber } = req.body;

    if (!req.file) {
      throw new BadRequestError("File is required");
    }

    let newVersionNumber: number;

    if (versionNumber) {
      const versionNum = parseFloat(versionNumber);

      if (isNaN(versionNum) || !Number.isFinite(versionNum)) {
        throw new BadRequestError("Invalid version number format");
      }

      const existingVersion = await Version.findOne({
        documentId,
        versionNumber: versionNum,
      });

      if (existingVersion) {
        throw new BadRequestError(
          `Version ${versionNum} already exists for this document`
        );
      }

      const isValid = await Version.validateVersionNumber(
        documentId!,
        versionNum
      );
      if (!isValid) {
        throw new BadRequestError(
          "Invalid version number. Must be next minor version (e.g., 1.0 -> 1.1) or next major version (e.g., 1.9 -> 2.0)"
        );
      }

      newVersionNumber = versionNum;
    } else {
      const latestVersionNumber = await Version.getLatestVersionNumber(
        documentId!
      );

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
    // Create version record with the file path from multer
    const version = await Version.create({
      documentId,
      versionNumber: newVersionNumber,
      fileKey: req.file.filename,
      fileUrl: `/files/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({
      id: version.documentId,
      version: version.versionNumber.toFixed(1),
      fileUrl: `/files/${req.file.filename}`,
      uploadedAt: version.createdAt,
    });
  } catch (error) {
    // Clean up uploaded file if version creation fails
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError: any) {
        logger.error("Error cleaning up file:", {
          message: unlinkError.message,
          path: req.file.path,
        });
      }
    }
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

    const versions = await Version.find({ documentId: id });

    // Delete all files
    await Promise.all(versions.map((version) => deleteFile(version.fileKey)));

    // Delete version records
    await Version.deleteMany({ documentId: id });

    return res.status(200).json({
      message: `Successfully deleted all versions for document ${id}`,
    });
  } catch (error) {
    logger.error("Error deleting versions:", error);
    next(error);
  }
};
