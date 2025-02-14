import { body, param } from "express-validator";

export const createVersionValidation = [
  param("id")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Document ID is required"),
  body("versionNumber")
    .optional()
    .isFloat()
    .withMessage(
      "Version number must be a valid number with one decimal place (e.g., 1.0, 1.1)"
    ),
];

export const getVersionsValidation = [
  param("id")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Document ID is required"),
];
