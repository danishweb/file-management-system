import { Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";

// Create document
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    // Validate folder if specified
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
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
    res.status(500).json({ message: "Error creating document", error });
  }
};

// Get document details
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Error fetching document", error });
  }
};

// Update document
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    // Validate folder if specified
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
    }

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.title = title || document.title;
    document.content = content || document.content;
    document.folderId = folderId || document.folderId;

    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Error updating document", error });
  }
};

// Delete document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await document.deleteOne();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error });
  }
};

// Search documents
export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
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
    res.status(500).json({ message: "Error searching documents", error });
  }
};

// Get total documents count
export const getTotalDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const count = await Document.countDocuments({ userId });
    res.json({ totalDocuments: count });
  } catch (error) {
    res.status(500).json({ message: "Error getting document count", error });
  }
};
