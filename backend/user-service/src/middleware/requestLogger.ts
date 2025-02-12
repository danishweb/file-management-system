import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logRequest(req);
  next();
};
