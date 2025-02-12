import { body, param, query } from "express-validator";

export const createDocumentValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Document title is required")
    .isLength({ max: 255 })
    .withMessage("Document title cannot exceed 255 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string"),

  body("folderId")
    .optional()
    .isMongoId()
    .withMessage("Invalid folder ID"),
];

export const updateDocumentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid document ID"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Document title cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Document title cannot exceed 255 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string"),

  body("folderId")
    .optional()
    .isMongoId()
    .withMessage("Invalid folder ID"),
];

export const getDocumentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid document ID"),
];

export const deleteDocumentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid document ID"),
];

export const searchDocumentValidation = [
  query("query")
    .trim()
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ max: 100 })
    .withMessage("Search query cannot exceed 100 characters"),
];
