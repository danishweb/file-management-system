import { config } from "dotenv";
import express, { Express, Request, Response } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import logger from "./utils/logger";

// Load environment variables
config();

const app: Express = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9002;

// health check
app.get("/ping", (_req: Request, res: Response): void => {
  res.json({
    status: "pong",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, (): void => {
  logger.info(
    `[server]: Version service is running at http://localhost:${PORT}`
  );
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  logger.error("Unhandled Rejection:", error);
  process.exit(1);
});
