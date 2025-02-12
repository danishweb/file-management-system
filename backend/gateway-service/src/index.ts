import express, { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import { config } from "dotenv";

// Load environment variables
config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

// Service URLs
const USER_SERVICE_URL = "http://localhost:9000";
const HIERARCHY_SERVICE_URL = "http://localhost:9001";
const VERSION_SERVICE_URL = "http://localhost:9002";

// Health check
app.get("/health", (_req: Request, res: Response): void => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Proxy configuration
const createProxy = (target: string, pathPrefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^/api${pathPrefix}`]: "",
    },
    onError: (err: Error, _req: Request, res: Response) => {
      console.error(`Proxy Error: ${err.message}`);
      res.status(500).json({
        error: "Service Unavailable",
        message: "The requested service is currently unavailable",
      });
    },
  });

// Route configurations
app.use("/api/users", createProxy(USER_SERVICE_URL, "/users"));

app.use("/api/hierarchy", createProxy(HIERARCHY_SERVICE_URL, "/hierarchy"));

app.use("/api/versions", createProxy(VERSION_SERVICE_URL, "/versions"));

app.listen(PORT, (): void => {
  console.log(`[Gateway]: API Gateway is running at http://localhost:${PORT}`);
});
