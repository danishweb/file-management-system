import multer from "multer";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { BadRequestError } from "../utils/errors";

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE
  ? parseInt(process.env.MAX_FILE_SIZE)
  : 1024 * 1024 * 1024; // 1GB default

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, `${randomName}${fileExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single("file");

export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        return next(new BadRequestError(`File size cannot exceed ${maxSizeMB}MB`));
      }
      return next(new BadRequestError(err.message));
    } else if (err) {
      return next(new BadRequestError(err.message));
    }
    next();
  });
};
