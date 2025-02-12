import { errorHandler } from "./middleware/errorHandler";
import { config } from "dotenv";
import express, { Express, Request, Response, NextFunction } from "express";
import { requestLogger } from "./middleware/requestLogger";
import logger from "./utils/logger";
import { connectDatabase } from "./config/database";
import userRoutes from "./routes/userRoutes";
import { NotFoundError } from "./utils/errors";

// Load environment variables
config();

// Initialize express
const app: Express = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000;

// Health check route (before API routes)
app.get("/ping", (_req: Request, res: Response): void => {
  res.json({
    status: "pong",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/", userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server and connect to database
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(PORT, (): void => {
      logger.info(`User service is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Global error handlers
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  logger.error("Unhandled Rejection:", error);
  process.exit(1);
});
