import { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import { Document } from "../models/Document";
import { versionApi } from "../services/versionApi";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";
import logger from "../utils/logger";
import { Folder } from "../models/Folder";

// Create document
export const createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, id: folder } = matchedData(req);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = new Document({
      title,
      folderId: folder || null,
      createdBy: userId,
      updatedBy: userId,
      access: [
        {
          userId: userId,
          role: "owner",
        },
      ],
    });

    await document.save();

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Get document
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = matchedData(req);
    const userId = req.user?.id;

    // Find document
    const document = await Document.findOne({
      _id: id,
      deletedAt: null,
      access: { $elemMatch: { userId } },
      isDeleted: false,
    }).populate("folderId", "title");

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
    logger.error("Error getting document:", error);
    next(error);
  }
};

// Create document version
export const createVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, versionNumber } = matchedData(req);

    const file = req.file;

    if (!file) {
      throw new BadRequestError("File is required");
    }

    const newVersion = await versionApi.createVersion(id, file, versionNumber);

    res.status(201).json(newVersion);
  } catch (error) {
    next(error);
  }
};

// Get document versions
export const getVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = matchedData(req);

    try {
      const { versions } = await versionApi.getAllVersions(id);

      return res.json(versions);
    } catch (error) {
      logger.error("Error fetching versions:", error);
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new Error("Failed to fetch versions");
    }
  } catch (error) {
    logger.error("Error getting document:", error);
    next(error);
  }
};

// Update document
export const updateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, title } = matchedData(req);
    const userId = req.user?.id;

    const document = await Document.findOne({
      _id: id,
      deletedAt: null,
      access: { $elemMatch: { userId } },
    });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    // Update document
    document.title = title.trim();
    document.updatedAt = new Date();
    await document.save();

    res.json(document);
  } catch (error) {
    logger.error("Error updating document:", error);
    next(error);
  }
};

// Delete document
export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = matchedData(req);
    const userId = req.user?.id;

    const document = await Document.findOne({
      _id: id,
      deletedAt: null,
      isDeleted: false,
      access: { $elemMatch: { userId } },
    });

    if (!document) {
      throw new NotFoundError("Document not found");
    }

    // Soft delete the document
    document.isDeleted = true;
    document.deletedAt = new Date();

    await versionApi.deleteVersions(id);

    await document.save();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    logger.error("Error deleting document:", error);
    next(error);
  }
};

export const searchDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = matchedData(req);
    const userId = req.user?.id;

    // Search documents with text index
    const documents = await Document.find(
      {
        $text: { $search: search },
        deletedAt: null,
        "access.userId": userId,
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate({
        path: "folderId",
        select: "title parentId",
        match: { deletedAt: null },
      });

    // Resolve folder paths
    const results = await Promise.all(
      documents.map(async (doc) => ({
        id: doc._id,
        title: doc.title,
        folderPath: await getFolderPath(doc.folderId),
      }))
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getTotalDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const totalDocuments = await Document.countDocuments({
      deletedAt: null,
      isDeleted: false,
      "access.userId": userId,
    });

    res.json({ totalDocuments });
  } catch (error) {
    next(error);
  }
};

// Helper to build folder path
const getFolderPath = async (folderId: any): Promise<string> => {
  const pathSegments: string[] = [];
  let currentFolder = await Folder.findById(folderId);

  while (currentFolder && currentFolder.parentId) {
    pathSegments.unshift(currentFolder.name);
    currentFolder = await Folder.findById(currentFolder.parentId);
  }

  if (currentFolder) pathSegments.unshift(currentFolder.name);
  return pathSegments.join("/") || "Root";
};
