import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createDocumentValidation,
  updateDocumentValidation,
  getDocumentValidation,
  deleteDocumentValidation,
  searchDocumentValidation,
} from "../validations/document.validation";
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getTotalDocuments,
} from "../controllers/documentController";

const router = Router();

// Create document
router.post("/", validate(createDocumentValidation), createDocument);

// Get document
router.get("/:id", validate(getDocumentValidation), getDocument);

// Update document
router.put("/:id", validate(updateDocumentValidation), updateDocument);

// Delete document
router.delete("/:id", validate(deleteDocumentValidation), deleteDocument);

// Search documents
router.get("/filter", validate(searchDocumentValidation), searchDocuments);

// Get total documents
router.get("/total-documents", getTotalDocuments);

export default router;
