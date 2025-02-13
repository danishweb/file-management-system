import { NextFunction, Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import {
  BadRequestError,
  DuplicateError,
  NotFoundError,
} from "../utils/errors";

// Get root level folders
export const getRootFolders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const folders = await Folder.find({ userId, parentFolder: null });
    res.json(folders);
  } catch (error) {
    next(error);
  }
};

// Get folder contents (subfolders and documents)
export const getFolderContents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      throw new NotFoundError("Folder not found");
    }

    const [subfolders, documents] = await Promise.all([
      Folder.find({ userId, parentFolder: folderId }),
      Document.find({ userId, folderId }),
    ]);

    res.json({
      folder,
      subfolders,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

// Create new folder
export const createFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, parentFolder } = req.body;
    const userId = req.user?.id;

    // Check if parent folder exists if specified
    if (parentFolder) {
      const parentFolderDoc = await Folder.findOne({
        _id: parentFolder,
        userId,
      });
      if (!parentFolderDoc) {
        throw new NotFoundError("Parent folder not found");
      }
    }

    // Check for duplicate folder name in the same level
    const existingFolder = await Folder.findOne({
      name,
      userId,
      parentFolder: parentFolder || null,
    });

    if (existingFolder) {
      throw new DuplicateError("Folder with this name already exists");
    }

    const folder = new Folder({
      name,
      userId,
      parentFolder: parentFolder || null,
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
};

// Update folder
export const updateFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      throw new NotFoundError("Folder not found");
    }

    // Check for duplicate folder name in the same level
    const existingFolder = await Folder.findOne({
      _id: { $ne: id },
      name,
      userId,
      parentFolder: folder.parentFolder,
    });

    if (existingFolder) {
      throw new DuplicateError("Folder with this name already exists");
    }

    folder.name = name;
    await folder.save();
    res.json(folder);
  } catch (error) {
    next(error);
  }
};

// Delete folder and its contents
export const deleteFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) throw new BadRequestError("Folder ID is required");

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder || folder.isDeleted) {
      throw new NotFoundError("Folder not found");
    }

    await Folder.softDelete(id);

    res.json({ message: "Folder and its contents deleted successfully" });
  } catch (error) {
    next(error);
  }
};
