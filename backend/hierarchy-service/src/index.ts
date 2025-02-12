import { config } from "dotenv";
config();

import express, { Express } from "express";
import { connectDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { authenticate } from "./middleware/authenticate";
import logger from "./utils/logger";
import folderRoutes from "./routes/folderRoutes";
import documentRoutes from "./routes/documentRoutes";

const app: Express = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use("/", authenticate, folderRoutes);
app.use("/documents", authenticate, documentRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9001;

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(PORT, (): void => {
      logger.info(`Hierarchy service is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  logger.error("Unhandled Rejection:", error);
  process.exit(1);
});
