import { NextFunction, Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import { BadRequestError, DuplicateError, NotFoundError } from "../utils/errors";

// Create document
export const createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    // Validate folder if specified
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }
    }

    const document = new Document({
      title,
      content,
      userId,
      folderId: folderId || null,
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
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

    if (!id) throw new BadRequestError("Document ID is required");

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    res.json(document);
  } catch (error) {
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
    const { id } = req.params;
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    if (!id) throw new BadRequestError("Document ID is required");

    // Validate folder if specified
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }
    }

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    document.title = title || document.title;
    document.content = content || document.content;
    document.folderId = folderId || document.folderId;

    await document.save();
    res.json(document);
  } catch (error) {
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
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) throw new BadRequestError("Document ID is required");

    const document = await Document.findOne({ _id: id, userId });
    if (!document || document.isDeleted) {
      throw new NotFoundError("Document not found");
    }

    await Document.softDelete(id);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Search documents
export const searchDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query) {
      throw new BadRequestError("Search query is required");
    }

    const documents = await Document.find({
      userId,
      $text: { $search: query as string },
    }).populate("folderId", "path");

    const results = documents.map((doc) => ({
      id: doc._id,
      title: doc.title,
      folderPath: doc.folderId ? (doc.folderId as any).path : "Root",
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Get total documents count
export const getTotalDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const count = await Document.countDocuments({ userId });
    res.json({ totalDocuments: count });
  } catch (error) {
    next(error);
  }
};
