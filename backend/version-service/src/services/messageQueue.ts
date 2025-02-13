import amqp, { Channel, Connection } from "amqplib";
import logger from "../utils/logger";
import { QueueConfig } from "../types/events";

// Define queues
export const QUEUES = {
  DOCUMENT_CREATED: "document.created",
  DOCUMENT_UPDATED: "document.updated",
};

export class MessageQueueService {
  private static instance: MessageQueueService;
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private constructor() {}

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  public async connect(): Promise<void> {
    try {
      const amqpUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      this.connection = await amqp.connect(amqpUrl);
      this.channel = await this.connection.createChannel();

      const queues: QueueConfig[] = [
        { name: QUEUES.DOCUMENT_CREATED, options: { durable: true } },
        { name: QUEUES.DOCUMENT_UPDATED, options: { durable: true } },
      ];

      // Create all queues
      for (const queue of queues) {
        await this.channel.assertQueue(queue.name, queue.options);
        logger.info(`Queue ${queue.name} is ready`);
      }

      logger.info("Successfully connected to RabbitMQ");
    } catch (error) {
      logger.error("Error connecting to RabbitMQ:", error);
      throw error;
    }
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("Message queue channel not initialized");
    }
    return this.channel;
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info("Closed RabbitMQ connection");
    } catch (error) {
      logger.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageQueueService = MessageQueueService.getInstance();
