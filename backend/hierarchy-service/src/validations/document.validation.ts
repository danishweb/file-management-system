import { body, param, query } from "express-validator";

export const createDocumentValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("id").optional().isMongoId().withMessage("Invalid folder ID"),
];

export const getDocumentValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
];

export const createVersionValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
  body("versionNumber")
    .optional()
    .isFloat()
    .withMessage(
      "Version number must be a valid number with one decimal place (e.g., 1.0, 1.1)"
    ),
];

export const getVersionsValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
];

export const deleteDocumentValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
];

export const updateDocumentValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
  body("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Title must be between 1 and 255 characters"),
];

export const searchValidation = [
  query("search")
    .trim()
    .notEmpty()
    .withMessage("Search is required")
    .isString()
    .withMessage("Search must be a string")
    .isLength({ min: 3 })
    .withMessage("Search must be at least 3 characters long"),
];
