import { body, param } from "express-validator";

export const createFolderValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isLength({ max: 255 })
    .withMessage("Folder name cannot exceed 255 characters")
    .matches(/^[a-zA-Z0-9\s_-]+$/)
    .withMessage(
      "Folder name can only contain letters, numbers, spaces, hyphens and underscores"
    ),

  body("parentFolder")
    .optional({ values: "null" })
    .isMongoId()
    .withMessage("Invalid parent folder ID"),
];

export const updateFolderValidation = [
  param("id").isMongoId().withMessage("Invalid folder ID"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isLength({ max: 255 })
    .withMessage("Folder name cannot exceed 255 characters")
    .matches(/^[a-zA-Z0-9\s_-]+$/)
    .withMessage(
      "Folder name can only contain letters, numbers, spaces, hyphens and underscores"
    ),
];

export const getFolderValidation = [
  param("folderId").isMongoId().withMessage("Invalid folder ID"),
];

export const deleteFolderValidation = [
  param("id").isMongoId().withMessage("Invalid folder ID"),
];
