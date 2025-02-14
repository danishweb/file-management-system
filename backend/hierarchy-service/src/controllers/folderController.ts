import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import { DuplicateError, NotFoundError } from "../utils/errors";
import { propagateAccessChange, validateAccess } from "../utils/permissions";
import { withTransaction } from "../utils/db";
import { matchedData } from "express-validator";

// Get root level folders
export const getRootFolders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const folders = await Folder.find({
      parentId: null,
      isDeleted: false,
      access: {
        $elemMatch: { userId: userId },
      },
    });

    res.json(
      folders.map((folder) => ({
        id: folder._id,
        name: folder.name,
        path: folder.path,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        createdBy: folder.createdBy,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// Get folder contents
export const getFolderContents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = matchedData(req);
    const userId = req.user?.id;

    const folder = await Folder.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!folder) {
      throw new NotFoundError("Folder not found");
    }

    const [subfolders, documents] = await Promise.all([
      Folder.find({
        parentId: id,
        isDeleted: false,
        access: {
          $elemMatch: { userId: userId },
        },
      }),
      Document.find({
        folderId: id,
        isDeleted: false,
        access: {
          $elemMatch: { userId: userId },
        },
      }).lean(),
    ]);

    res.json({
      folder: {
        id: folder._id,
        name: folder.name,
        path: folder.path,
        parentId: folder.parentId,
      },
      contents: {
        folders: subfolders.map((subfolder) => ({
          id: subfolder._id,
          name: subfolder.name,
          path: subfolder.path,
          parentId: subfolder.parentId,
          createdAt: subfolder.createdAt,
          createdBy: subfolder.createdBy,
        })),
        documents: documents.map((doc) => ({
          id: doc._id,
          name: doc.title,
          createdAt: doc.createdAt,
          createdBy: doc.createdBy,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create folder
export const createFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, parentId } = matchedData(req);
    const userId = req.user?.id;

    const result = await withTransaction(async (session) => {
      // If parent folder exists, check if user has editor/owner access
      if (parentId) {
        // Check if parent folder exists and is not deleted
        const parentFolder = await Folder.findOne(
          {
            _id: parentId,
            isDeleted: false,
          },
          null,
          { session }
        );
        if (!parentFolder) {
          throw new NotFoundError("Folder not found");
        }

        await validateAccess(userId!, parentId, "folder", "editor");
      }

      // Check for duplicate folder name in the same level
      const existingFolder = await Folder.findOne(
        {
          name,
          parentId: parentId || null,
          isDeleted: false,
          access: {
            $elemMatch: { userId },
          },
        },
        null,
        { session }
      );

      if (existingFolder) {
        throw new DuplicateError("Folder with this name already exists");
      }

      const folder = new Folder({
        name,
        parentId: parentId || null,
        createdBy: userId,
        updatedBy: userId,
        access: [{ userId, role: "owner" }],
      });

      await folder.save({ session });

      // If parent exists, inherit its access permissions
      if (parentId) {
        const parentFolder = await Folder.findById(parentId).session(session);
        if (parentFolder) {
          await propagateAccessChange(
            folder._id as Types.ObjectId,
            parentFolder.access,
            session
          );
        }
      }

      return folder;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Update folder name
export const updateFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, name } = matchedData(req);

    const userId = req.user?.id;

    const result = await withTransaction(async (session) => {
      const folder = await Folder.findOne(
        {
          _id: id,
          isDeleted: false,
        },
        null,
        { session }
      );
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }

      // Check for duplicate name in the same level
      const existingFolder = await Folder.findOne(
        {
          _id: { $ne: id },
          name: name,
          parentId: folder.parentId,
          isDeleted: false,
        },
        null,
        { session }
      );

      if (existingFolder) {
        throw new DuplicateError(
          "Folder with this name already exists in this location"
        );
      }

      // Generate the new path for the folder
      const oldPath = folder.path;
      const parentFolder = folder.parentId
        ? await Folder.findById(folder.parentId).session(session)
        : null;
      const newPath = parentFolder
        ? `${parentFolder.path}/${name}`
        : `/${name}`;

      // Update the current folder with new name and path
      const updatedFolder = await Folder.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            name: name,
            path: newPath,
            updatedBy: userId,
          },
        },
        { new: true, session }
      );

      // Update paths of all descendant folders
      await Folder.updateMany(
        {
          path: { $regex: `^${oldPath}/` },
          isDeleted: false,
        },
        [
          {
            $set: {
              path: {
                $concat: [
                  newPath,
                  {
                    $substr: [
                      "$path",
                      { $strLenCP: oldPath },
                      {
                        $subtract: [
                          { $strLenCP: "$path" },
                          { $strLenCP: oldPath },
                        ],
                      },
                    ],
                  },
                ],
              },
              updatedBy: userId,
            },
          },
        ],
        { session }
      );

      // Update paths of all descendant documents
      await Document.updateMany(
        {
          path: { $regex: `^${oldPath}/` },
          isDeleted: false,
        },
        [
          {
            $set: {
              path: {
                $concat: [
                  newPath,
                  {
                    $substr: [
                      "$path",
                      { $strLenCP: oldPath },
                      {
                        $subtract: [
                          { $strLenCP: "$path" },
                          { $strLenCP: oldPath },
                        ],
                      },
                    ],
                  },
                ],
              },
              updatedBy: userId,
            },
          },
        ],
        { session }
      );

      return updatedFolder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Share folder
export const shareFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, role, targetUserId } = matchedData(req);

    const result = await withTransaction(async (session) => {
      const folder = await Folder.findOne(
        {
          _id: id,
          isDeleted: false,
        },
        null,
        { session }
      );
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }

      const existingAccess = folder.access.filter(
        (entry) => entry.userId.toString() !== targetUserId
      );

      folder.access = [...existingAccess, { userId: targetUserId, role }];
      await folder.save({ session });

      // Propagate access changes to subfolders and documents
      await propagateAccessChange(
        folder._id as Types.ObjectId,
        folder.access,
        session
      );

      return folder;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Delete folder
export const deleteFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = matchedData(req);
    const userId = req.user?.id;

    await withTransaction(async (session) => {
      const folder = await Folder.findById(id).session(session);
      if (!folder) {
        throw new NotFoundError("Folder not found");
      }

      // Soft delete the folder and all its contents
      await Promise.all([
        Folder.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: userId,
            },
          },
          { session }
        ),
        Folder.updateMany(
          { path: { $regex: `^${folder.path}/` } },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: userId,
            },
          },
          { session }
        ),
        Document.updateMany(
          { folderId: id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: userId,
            },
          },
          { session }
        ),
      ]);
    });

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    next(error);
  }
};
