import express, { Express, Request, Response } from "express";
import { config } from "dotenv";
import { errorHandler } from "@/middleware/errorHandler";

// Load environment variables
config();

const app: Express = express();

// Middleware
app.use(express.json());

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9001;

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
  console.log(
    `[server]: Hierarchy service is running at http://localhost:${PORT}`
  );
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled Rejection:", error);
  process.exit(1);
});
