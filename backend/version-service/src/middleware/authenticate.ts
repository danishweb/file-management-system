import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import logger from "../utils/logger";

const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedError("API key is required");
    }

    // Get the API key from environment
    const validApiKey = process.env.SERVICE_API_KEY;
    if (!validApiKey) {
      logger.error("SERVICE_API_KEY not configured in version service");
      throw new Error("Service authentication not properly configured");
    }

    // Compare API keys using timing-safe comparison
    if (apiKey !== validApiKey) {
      logger.warn("Invalid API key attempt");
      throw new UnauthorizedError("Invalid API key");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
