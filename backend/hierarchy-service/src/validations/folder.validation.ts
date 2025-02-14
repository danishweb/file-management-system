import { body, param } from "express-validator";
import { AccessRole } from "../utils/permissions";

export const createFolderValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isString()
    .withMessage("Folder name must be a string")
    .isLength({ min: 1, max: 255 })
    .withMessage("Folder name must be between 1 and 255 characters"),
  body("parentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent folder ID"),
];

export const getFolderValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid folder ID"),
];

export const updateFolderValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid folder ID"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isString()
    .withMessage("Folder name must be a string")
    .isLength({ min: 1, max: 255 })
    .withMessage("Folder name must be between 1 and 255 characters"),
];

export const shareFolderValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid folder ID"),
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["owner", "editor", "viewer"] as AccessRole[])
    .withMessage("Role must be one of: owner, editor, viewer"),
];

export const deleteFolderValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid folder ID"),
];
