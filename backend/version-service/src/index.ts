import { config } from "dotenv";
// Load environment variables
config();

import express, { Express, Request, Response } from "express";
import path from "path";
import { connectDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import versionRoutes from "./routes/versionRoutes";
import logger from "./utils/logger";

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5003;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');


// Middleware
app.use(express.json());
app.use(requestLogger);

// Serve static files from the uploads directory
app.use('/files', express.static(UPLOAD_DIR, {
  maxAge: '1d', // Cache files for 1 day
  immutable: true
}));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Version routes
app.use("/versions", versionRoutes);

// Error handling middleware
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

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

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  logger.error("Unhandled Rejection:", error);
  process.exit(1);
});
