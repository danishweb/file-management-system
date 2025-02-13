import { Channel } from "amqplib";
import logger from "../utils/logger";
import { QUEUES } from "./messageQueue";

export class ConsumerService {
  private channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  private setupConsumer(queue: string, handler: Function) {
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          await handler(msg);
          this.channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing ${queue} event:`, error);
          // Requeue the message for retry
          this.channel.nack(msg, false, true);
        }
      }
    });
    logger.info(`Consumer setup completed for queue: ${queue}`);
  }

  public setupConsumers(): void {
   

    logger.info("All message queue consumers are ready");
  }
}
