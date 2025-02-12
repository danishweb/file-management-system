import { Request, Response } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";

// Get root level folders
export const getRootFolders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const folders = await Folder.find({ userId, parentFolder: null });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching root folders", error });
  }
};

// Get folder contents (subfolders and documents)
export const getFolderContents = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
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
    res.status(500).json({ message: "Error fetching folder contents", error });
  }
};

// Create new folder
export const createFolder = async (req: Request, res: Response) => {
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
        return res.status(404).json({ message: "Parent folder not found" });
      }
    }

    // Check for duplicate folder name in the same level
    const existingFolder = await Folder.findOne({
      name,
      userId,
      parentFolder: parentFolder || null,
    });

    if (existingFolder) {
      return res.status(400).json({
        message: "Folder with this name already exists in this location",
      });
    }

    const folder = new Folder({
      name,
      userId,
      parentFolder: parentFolder || null,
      path: `${parentFolder || ""}/${name}`,
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: "Error creating folder", error });
  }
};

// Update folder
export const updateFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Check for duplicate folder name in the same level
    const existingFolder = await Folder.findOne({
      _id: { $ne: id },
      name,
      userId,
      parentFolder: folder.parentFolder,
    });

    if (existingFolder) {
      return res.status(400).json({
        message: "Folder with this name already exists in this location",
      });
    }

    folder.name = name;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: "Error updating folder", error });
  }
};

// Delete folder and its contents
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Get all subfolder paths recursively
    const subfolders = await Folder.find({
      userId,
      path: { $regex: `^${folder.path}/` },
    });

    const folderIds = [id, ...subfolders.map((f) => f._id)];

    // Delete all documents in the folders
    await Document.deleteMany({
      userId,
      folderId: { $in: folderIds },
    });

    // Delete all subfolders
    await Folder.deleteMany({
      _id: { $in: folderIds },
    });

    res.json({ message: "Folder and its contents deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting folder", error });
  }
};
