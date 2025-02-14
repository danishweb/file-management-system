import { NextFunction, Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import { versionApi } from "../services/versionApi";
import { BadRequestError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

// Create document
export const createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, folderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate folder if provided
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }
    }

    // Create document
    const document = new Document({
      title,
      userId,
      folderId: folderId || null,
    });

    try {
      await document.save();

      res.status(201).json(document);
    } catch (error: any) {
      logger.error("Error creating document:", error);
      next(error);
    }
  } catch (error) {
    logger.error("Error creating document:", error);
    next(error);
  }
};

// Get document details
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Find document
    const document = await Document.findOne({ _id: id, userId }).populate(
      "folderId",
      "title"
    );

    if (!document) {
      throw new NotFoundError("Document not found");
    }

    try {
      // Get all versions from version service
      const { versions } = await versionApi.getAllVersions(document.id);

      return res.json({
        id: document.id,
        title: document.title,
        folder: document.folderId ? document.folderId.id : null,
        createdAt: document.createdAt,
        versions: versions,
      });
    } catch (error) {
      logger.error("Error fetching version details:", error);
      // Return document even if version service fails
      return res.json({
        id: document.id,
        title: document.title,
        folder: document.folderId ? document.folderId.id : null,
        createdAt: document.createdAt,
        versions: [],
      });
    }
  } catch (error) {
    next(error);
  }
};

export const createVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { versionNumber } = req.body;
    const file = req.file;

    if (!file) throw new BadRequestError("File is required");

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    try {
      const versionDetails = await versionApi.createVersion(
        document.id,
        file,
        versionNumber && parseFloat(versionNumber)
      );
      return res.status(201).json(versionDetails);
    } catch (error) {
      logger.error("Error creating version:", error);
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new Error("Failed to create version");
    }
  } catch (error) {
    next(error);
  }
};

export const getVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    try {
      const { versions } = await versionApi.getAllVersions(document.id);

      return res.json(versions);
    } catch (error) {
      logger.error("Error fetching versions:", error);
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new Error("Failed to fetch versions");
    }
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user?.id;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    // Update document
    document.title = title.trim();
    document.updatedAt = new Date();
    await document.save();

    return res.json({
      id: document._id,
      title: document.title,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
