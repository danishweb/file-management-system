import { Router } from "express";
import {
  createFolder,
  deleteFolder,
  getFolderContents,
  getRootFolders,
  shareFolder,
  updateFolder,
} from "../controllers/folderController";
import { checkAccess } from "../middleware/checkAccess";
import { validate } from "../middleware/validate";
import {
  createFolderValidation,
  deleteFolderValidation,
  getFolderValidation,
  shareFolderValidation,
  updateFolderValidation,
} from "../validations/folder.validation";

const router = Router();

// Get root level folders
router.get("/viewstore", getRootFolders);

// Get folder contents
router.get(
  "/viewstore/:id",
  validate(getFolderValidation),
  checkAccess("folder", "viewer"),
  getFolderContents
);

// Create folder
router.post("/folders", validate(createFolderValidation), createFolder);

// Update folder name
router.put(
  "/folders/:id",
  validate(updateFolderValidation),
  checkAccess("folder", "editor"),
  updateFolder
);

// Delete folder
router.delete(
  "/folders/:id",
  validate(deleteFolderValidation),
  checkAccess("folder", "editor"),
  deleteFolder
);

// Share folder
router.post(
  "/folders/:id/share",
  validate(shareFolderValidation),
  checkAccess("folder", "owner"),
  shareFolder
);
export default router;
