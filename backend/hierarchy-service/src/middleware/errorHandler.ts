import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { AppError, ErrorStatus } from "../utils/errors";
import { logError } from "../utils/logger";

interface ErrorResponse {
  status: ErrorStatus;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export const errorHandler = (
  err:
    | Error
    | AppError
    | MongooseError.CastError
    | MongooseError.ValidationError,
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

  // Handle Mongoose errors
  if (err instanceof MongooseError) {
    response.status = "fail";

    // Handle duplicate key errors
    if ((err as any).code === 11000) {
      const field = Object.keys((err as any).keyPattern)[0];
      response.message = `${field} already exists`;
      response.errors = [
        {
          field: field as string,
          message: `${field} already exists`,
        },
      ];
      res.status(409).json(response);
      return;
    }
  }

  // Handle operational errors (known application errors)
  if (err instanceof AppError) {
    response.status = err.status;
    response.message = err.message;
    if (err.details?.errors) {
      response.errors = err.details.errors;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle all other errors
  res.status(500).json({
    status: "error" as const,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
