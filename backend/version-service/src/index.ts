import { config } from "dotenv";
// Load environment variables
config();

import express, { Express, Request, Response } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import logger from "./utils/logger";
import { connectDatabase } from "./config/database";
import { messageQueueService } from "./services/messageQueue";
import { ConsumerService } from "./services/consumerService";

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9002;

// Middleware
app.use(express.json());
app.use(requestLogger);
app.use(errorHandler);

// Health check endpoint
app.get("/health", (_req: Request, res: Response): void => {
  res.json({
    service: "version-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

const shutdown = async () => {
  try {
    await messageQueueService.close();
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to message queue
    await messageQueueService.connect();

    // Setup message consumers
    const consumerService = new ConsumerService(
      messageQueueService.getChannel()
    );
    consumerService.setupConsumers();

    // Start HTTP server
    app.listen(PORT, (): void => {
      logger.info(`Version service is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
