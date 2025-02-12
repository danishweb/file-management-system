import { logRequest } from "../utils/logger";
import { NextFunction, Request, Response } from "express";

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logRequest(req);
  next();
};
