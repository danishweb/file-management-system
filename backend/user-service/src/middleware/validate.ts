import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import { ValidationError } from "../utils/errors";

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors
        .array()
        .map((error): { field: string; message: string } => ({
          field: error.type === "field" ? error.path : error.type,
          message: error.msg,
        }));

      return next(new ValidationError(validationErrors));
    }

    next();
  };
};
