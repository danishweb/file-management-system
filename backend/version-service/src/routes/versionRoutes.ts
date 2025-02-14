import { Router } from "express";
import {
  createVersion,
  getAllVersions,
  deleteVersions,
} from "../controllers/versionController";
import authenticate from "../middleware/authenticate";
import { uploadMiddleware } from "../middleware/upload";
import { validate } from "../middleware/validate";
import {
  createVersionValidation,
  getVersionsValidation,
} from "../validations/version.validation";

const router = Router();

router.use(authenticate);

// Get all versions of a document
router.get("/:id", validate(getVersionsValidation), getAllVersions);

// Create new version with file upload
router.post(
  "/:id",
  uploadMiddleware,
  validate(createVersionValidation),
  createVersion
);

// Delete all versions of a document
router.delete("/:id", deleteVersions);

export default router;
