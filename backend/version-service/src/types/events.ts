export interface DocumentEvent {
  documentId: string;
  userId: string;
  fileKey: string;
  originalName: string;
  contentType: string;
  size: number;
}

export interface QueueConfig {
  name: string;
  options: {
    durable: boolean;
  };
}
