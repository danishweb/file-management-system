export type ErrorStatus = "error" | "fail";

export interface ErrorDetails {
  errors?: Array<{
    field: string;
    message: string;
  }>;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: ErrorStatus;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(message: string, statusCode: number, details?: ErrorDetails) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super("Validation failed", 400, { errors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class DuplicateError extends AppError {
  constructor(field: string) {
    super(`${field} already exists`, 409);
  }
}
