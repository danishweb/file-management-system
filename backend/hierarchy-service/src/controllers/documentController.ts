import { NextFunction, Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import { NotFoundError } from "../utils/errors";
import { deleteFromS3, generatePresignedUrl, uploadToS3 } from "../utils/s3";

// Create document
export const createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, folderId } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }
    }

    const document = new Document({
      title,
      userId,
      folderId: folderId || null,
    });

    if (file) {
      const fileData = await uploadToS3(file, userId!);
      document.fileKey = fileData.key;
      document.contentType = file.mimetype;
      document.size = file.size;
      document.originalName = file.originalname;
    }

    await document.save();

    let presignedUrl;
    if (document.fileKey) {
      presignedUrl = await generatePresignedUrl(document.fileKey);
    }

    res.status(201).json({
      document,
      presignedUrl,
    });
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

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    let presignedUrl;
    if (document.fileKey) {
      presignedUrl = await generatePresignedUrl(document.fileKey);
    }

    res.json({
      document,
      presignedUrl,
    });
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
    const { title, folderId } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    if (folderId && folderId !== document.folderId?.toString()) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }
      document.folderId = folderId;
    }

    if (title) document.title = title;

    if (file) {
      if (document.fileKey) {
        await deleteFromS3(document.fileKey);
      }

      const fileData = await uploadToS3(file, userId!);
      document.fileKey = fileData.key;
      document.contentType = file.mimetype;
      document.size = file.size;
      document.originalName = file.originalname;
    }

    await document.save();

    let presignedUrl;
    if (document.fileKey)
      presignedUrl = await generatePresignedUrl(document.fileKey);

    res.json({
      document,
      presignedUrl,
    });
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

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    if (document.fileKey) {
      await deleteFromS3(document.fileKey);
    }

    document.isDeleted = true;
    document.deletedAt = new Date();
    await document.save();

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

    const documents = await Document.find({
      userId,
      isDeleted: false,
      $or: [{ title: { $regex: query, $options: "i" } }],
    });

    res.json(documents);
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
    const count = await Document.countDocuments({ userId, isDeleted: false });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};
