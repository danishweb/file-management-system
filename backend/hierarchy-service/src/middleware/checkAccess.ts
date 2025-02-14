import { Request, Response, NextFunction } from "express";
import { Document } from "../models/Document";
import { Folder } from "../models/Folder";
import { NotFoundError } from "../utils/errors";
import { validateAccess, AccessRole } from "../utils/permissions";
import { matchedData } from "express-validator";

type ResourceType = "document" | "folder";

export const checkAccess = (
  resourceType: ResourceType,
  requiredRole: AccessRole
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = matchedData(req);
      const userId = req.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Check if resource exists first
      const Model = resourceType === "document" ? Document : Folder;
      // @ts-ignore
      const resource = await Model.findOne({
        _id: id,
        isDeleted: false,
        deletedAt: null
      });
      if (!resource) {
        throw new NotFoundError(`${resourceType} not found`);
      }

      // Validate access considering the resource hierarchy
      await validateAccess(userId, id!, resourceType, requiredRole);

      next();
    } catch (error) {
      next(error);
    }
  };
};
