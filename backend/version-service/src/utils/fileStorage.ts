import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { BadRequestError } from './errors';
import { Readable } from 'stream';

const pipelineAsync = promisify(pipeline);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface FileUploadResult {
    key: string;
    fileUrl: string;
}

/**
 * Handles file upload using streams to manage memory efficiently
 */
export const saveFile = async (
    fileStream: Readable,
    originalFilename: string
): Promise<FileUploadResult> => {
    if (!fileStream || !originalFilename) {
        throw new BadRequestError('File stream and filename are required');
    }

    try {
        const fileExtension = path.extname(originalFilename).toLowerCase();
        const randomString = crypto.randomBytes(8).toString('hex');
        const key = `${randomString}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, key);

        // Create a write stream
        const writeStream = createWriteStream(filePath);

        // Use pipeline to handle streaming with proper error handling
        await pipelineAsync(
            fileStream,
            writeStream
        );

        const fileUrl = `/files/${key}`;

        return {
            key,
            fileUrl
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred while saving file';
        throw new BadRequestError(`Failed to save file: ${errorMessage}`);
    }
}

/**
 * Get file path from key
 */
export const getFilePath = (key: string): string => {
    return path.join(UPLOAD_DIR, key);
};

/**
 * Get file URL from key
 */
export const getFileUrl = (key: string): string => {
    return `/files/${key}`;
};

/**
 * Delete file from storage
 */
export const deleteFile = async (key: string): Promise<void> => {
    const filePath = getFilePath(key);
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        throw new BadRequestError('Failed to delete file');
    }
};

/**
 * Stream file to response
 */
export const streamFileToResponse = async (
    key: string,
    res: any
): Promise<void> => {
    const filePath = getFilePath(key);
    try {
        const readStream = createReadStream(filePath);
        await pipelineAsync(readStream, res);
    } catch (error) {
        throw new BadRequestError('Failed to stream file');
    }
};
