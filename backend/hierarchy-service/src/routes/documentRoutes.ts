import { Router } from "express";
import {
  createDocument,
  createVersion,
  deleteDocument,
  getDocument,
  getVersions,
  updateDocument,
} from "../controllers/documentController";
import { checkAccess } from "../middleware/checkAccess";
import { uploadMiddleware } from "../middleware/upload";
import { validate } from "../middleware/validate";
import {
  createDocumentValidation,
  createVersionValidation,
  deleteDocumentValidation,
  getDocumentValidation,
  getVersionsValidation,
  updateDocumentValidation,
} from "../validations/document.validation";

const router = Router();

// Get document
router.get("/:id", validate(getDocumentValidation), getDocument);

// Create document
router.post(
  "/",
  validate(createDocumentValidation),
  checkAccess("folder", "editor"),
  createDocument
);

// Create document version
router.post(
  "/:id/version",
  uploadMiddleware,
  validate(createVersionValidation),
  checkAccess("document", "editor"),
  createVersion
);

// Get document versions
router.get(
  "/:id/versions",
  validate(getVersionsValidation),
  checkAccess("document", "viewer"),
  getVersions
);

// Update document
router.put(
  "/:id",
  validate(updateDocumentValidation),
  checkAccess("document", "editor"),
  updateDocument
);

// Delete document
router.delete(
  "/:id",
  validate(deleteDocumentValidation),
  checkAccess("document", "owner"),
  deleteDocument
);

export default router;
