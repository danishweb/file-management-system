import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  getDocument,
  getTotalDocuments,
  searchDocuments,
  updateDocument,
} from "../controllers/documentController";
import { uploadMiddleware } from "../middleware/upload";
import { validate } from "../middleware/validate";
import {
  createDocumentValidation,
  deleteDocumentValidation,
  getDocumentValidation,
  searchDocumentValidation,
  updateDocumentValidation,
} from "../validations/document.validation";

const router = Router();

// Create document with file upload
router.post(
  "/",
  uploadMiddleware,
  validate(createDocumentValidation),
  createDocument
);

// Get document
router.get("/:id", validate(getDocumentValidation), getDocument);

// Update document with file upload
router.put(
  "/:id",
  uploadMiddleware,
  validate(updateDocumentValidation),
  updateDocument
);

// Delete document
router.delete("/:id", validate(deleteDocumentValidation), deleteDocument);

// Search documents
router.get("/filter", validate(searchDocumentValidation), searchDocuments);

// Get total documents
router.get("/total-documents", getTotalDocuments);

export default router;
