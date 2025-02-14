import multer from "multer";
import { BadRequestError } from "../utils/errors";
import { Request, Response, NextFunction } from "express";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
}).single("file");

// Wrapper to handle multer errors with proper typing
export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-expect-error
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new BadRequestError("File size cannot exceed 5MB"));
      }
      return next(new BadRequestError(err.message));
    } else if (err) {
      return next(err);
    }
    next();
  });
};
