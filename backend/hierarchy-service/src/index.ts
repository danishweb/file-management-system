import express, { Express, Request, Response } from "express";
import { config } from "dotenv";

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

app.listen(PORT, (): void => {
  console.log(
    `[server]: Hierarchy service is running at http://localhost:${PORT}`
  );
});
