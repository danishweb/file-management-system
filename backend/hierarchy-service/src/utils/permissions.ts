import mongoose, { Types } from "mongoose";
import { Document } from "../models/Document";
import { Folder, IAccess } from "../models/Folder";
import { ForbiddenError } from "./errors";

export type AccessRole = "owner" | "editor" | "viewer";

const roleHierarchy: Record<AccessRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export async function hasAccess(
  userId: string | Types.ObjectId,
  resourceId: string | Types.ObjectId, // folderId or documentId
  resourceType: "folder" | "document",
  requiredRole: AccessRole
): Promise<boolean> {
  try {
    const resourceObjectId = new Types.ObjectId(resourceId);

    // For documents, check both document and parent folder permissions
    if (resourceType === "document") {
      const document = await Document.findById(resourceObjectId)
        .select("folderId access")
        .lean();

      if (!document) return false;

      // Check document access
      const documentAccess = document.access.find(
        (entry) => entry.userId.toString() === userId.toString()
      );

      if (
        documentAccess &&
        roleHierarchy[documentAccess.role] >= roleHierarchy[requiredRole] // Check if the user has the required role (e.g., editor >= editor, viewer >= editor, etc.)
      ) {
        return true;
      }

      // If no sufficient document access, check parent folder
      return document.folderId
        ? hasAccess(userId, document.folderId, "folder", requiredRole)
        : false;
    }

    // For folders, check folder and parent folder permissions
    const folder: any = await Folder.aggregate([
      { $match: { _id: resourceObjectId, isDeleted: false } },
      {
        $graphLookup: {
          from: "folders",
          startWith: "$parentId",
          connectFromField: "parentId",
          connectToField: "_id",
          as: "ancestors",
        },
      },
    ]);

    if (!folder.length) return false;

    // Check permissions in the current folder and all ancestors
    const folderChain = [folder[0], ...folder[0].ancestors];

    return folderChain.some((f) => {
      const access = f.access.find(
        (entry: any) => entry.userId.toString() === userId.toString()
      );
      return (
        // @ts-ignore
        access && roleHierarchy[access.role] >= roleHierarchy[requiredRole]
      );
    });
  } catch (error) {
    console.error("Error checking permissions:", error);
    return false;
  }
}

export async function validateAccess(
  userId: string | Types.ObjectId,
  resourceId: string | Types.ObjectId,
  resourceType: "folder" | "document",
  requiredRole: AccessRole
): Promise<void> {
  const hasPermission = await hasAccess(
    userId,
    resourceId,
    resourceType,
    requiredRole
  );

  if (!hasPermission) {
    throw new ForbiddenError(
      `Insufficient permissions. Required: ${requiredRole}`
    );
  }
}

export async function propagateAccessChange(
  folderId: Types.ObjectId,
  access: IAccess[],
  session?: mongoose.mongo.ClientSession
): Promise<void> {
  try {
    // Get folder path first using the session
    const folder = await Folder.findById(folderId).session(session!);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Update all descendant folders in one query
    await Folder.updateMany(
      {
        path: { $regex: `^${folder.path}/` },
        isDeleted: false,
      },
      {
        $set: { access },
      },
      { session }
    );

    // Update all documents in descendant folders
    await Document.updateMany(
      {
        folderId,
        isDeleted: false,
      },
      {
        $set: { access },
      },
      { session }
    );
  } catch (error) {
    throw error;
  }
}
