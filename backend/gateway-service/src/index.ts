import { config } from "dotenv";
config();

import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// Service ports
const GATEWAY_PORT = process.env.PORT || 5000;
const USER_SERVICE_PORT = 5001;
const HIERARCHY_SERVICE_PORT = 5002;
const VERSION_SERVICE_PORT = 5003;

// Simple proxy for user service
app.use('/api/users', (req, res, next) => {
  logger.info('Proxying to user service:', {
    originalUrl: req.originalUrl,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  createProxyMiddleware({
    target: `http://localhost:${USER_SERVICE_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info('Received response from user service:', {
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers
      });
    },
    onError: (err, req, res) => {
      logger.error('User Service Proxy Error:', err);
      res.status(502).send('User Service Unavailable');
    }
  })(req, res, next);
});

// Simple proxy for hierarchy service
app.use('/api/hierarchy', createProxyMiddleware({
  target: `http://localhost:${HIERARCHY_SERVICE_PORT}`,
  changeOrigin: true,
  pathRewrite: { '^/api/hierarchy': '' }
}));

// Simple proxy for version service
app.use('/api/versions', createProxyMiddleware({
  target: `http://localhost:${VERSION_SERVICE_PORT}`,
  changeOrigin: true,
  pathRewrite: { '^/api/versions': '' }
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Gateway Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(GATEWAY_PORT, () => {
  logger.info(`API Gateway running at http://localhost:${GATEWAY_PORT}`);
  logger.info("Proxying to services:");
  logger.info(`- User Service: http://localhost:${USER_SERVICE_PORT}`);
  logger.info(`- Hierarchy Service: http://localhost:${HIERARCHY_SERVICE_PORT}`);
  logger.info(`- Version Service: http://localhost:${VERSION_SERVICE_PORT}`);
});
