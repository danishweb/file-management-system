import mongoose from "mongoose";
import logger from "../utils/logger";

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/version-service";
    await mongoose.connect(mongoUri);
    logger.info("Successfully connected to MongoDB.");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected.");
});
