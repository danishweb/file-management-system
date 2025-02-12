import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/errors";

interface JwtPayload {
  userId: string;
  type: "access" | "refresh";
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = {
        id: decoded.userId,
      };
      next();
    } catch (error) {
      throw new UnauthorizedError("Invalid token");
    }
  } catch (error) {
    next(error);
  }
};
