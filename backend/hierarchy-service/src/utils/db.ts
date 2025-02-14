import mongoose from "mongoose";
import logger from "./logger";

export type TransactionCallback<T> = (session: mongoose.mongo.ClientSession) => Promise<T>;

export const withTransaction = async <T>(callback: TransactionCallback<T>): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error("Transaction failed:", error);
    throw error;
  } finally {
    session.endSession();
  }
};
