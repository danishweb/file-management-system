import { Router } from "express";
import {
  createDocument,
  createVersion,
  getDocument,
  getVersions,
  updateDocument,
} from "../controllers/documentController";
import { validate } from "../middleware/validate";
import {
  createDocumentValidation,
  createVersionValidation,
  getDocumentValidation,
  getVersionsValidation,
  updateDocumentValidation,
} from "../validations/document.validation";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

router.post("/", validate(createDocumentValidation), createDocument);

// Get document
router.get("/:id", validate(getDocumentValidation), getDocument);

router.put("/:id", validate(updateDocumentValidation), updateDocument);

// Create document version
router.post(
  "/:id/version",
  uploadMiddleware,
  validate(createVersionValidation),
  createVersion
);

// Get document versions
router.get(
  "/:id/versions",
  validate(getVersionsValidation),
  getVersions
);

export default router;
