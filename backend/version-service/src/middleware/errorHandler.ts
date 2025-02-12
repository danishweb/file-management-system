import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  stack?: string;
  errors?: unknown;
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
