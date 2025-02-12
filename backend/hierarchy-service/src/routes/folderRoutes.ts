import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createFolderValidation,
  updateFolderValidation,
  getFolderValidation,
  deleteFolderValidation,
} from "../validations/folder.validation";
import {
  getRootFolders,
  getFolderContents,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../controllers/folderController";

const router = Router();

// Get root level folders
router.get("/viewstore", getRootFolders);

// Get folder contents
router.get(
  "/viewstore/:folderId",
  validate(getFolderValidation),
  getFolderContents
);

// Create folder
router.post("/folders", validate(createFolderValidation), createFolder);

// Update folder
router.put("/folders/:id", validate(updateFolderValidation), updateFolder);

// Delete folder
router.delete("/folders/:id", validate(deleteFolderValidation), deleteFolder);

export default router;
