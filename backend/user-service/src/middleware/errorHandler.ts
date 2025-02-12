import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logError } from "../utils/logger";

interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logError(err, req);

  const response: ErrorResponse = {
    status: "error",
    message: err.message || "Internal server error",
  };

  if (err instanceof AppError) {
    res.status(err.statusCode).json(response);
    return;
  }

  // Unhandled errors
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message: err.message,
    stack: err.stack,
  });
};
