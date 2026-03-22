import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Azure Blob Storage client wrapper.
 * Used for uploading knowledge base documents.
 * 
 * NOTE: Replace placeholder credentials with real Azure Storage credentials.
 */
class StorageService {
    private containerClient: ContainerClient | null = null;

    /** Initialize Blob Storage client. Call once at startup. */
    async initialize(): Promise<void> {
        if (!config.storage.connectionString) {
            logger.warn('Azure Storage credentials not configured — uploads will use local storage');
            return;
        }

        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(
                config.storage.connectionString
            );
            this.containerClient = blobServiceClient.getContainerClient(config.storage.containerName);
            await this.containerClient.createIfNotExists({ access: 'blob' });
            logger.info('Azure Blob Storage client initialized');
        } catch (error) {
            logger.error('Failed to initialize Azure Blob Storage', { error });
        }
    }

    /** Upload a file to blob storage and return the URL */
    async uploadFile(
        filename: string,
        buffer: Buffer,
        contentType: string
    ): Promise<string | null> {
        if (!this.containerClient) {
            logger.warn('Storage not configured — skipping blob upload');
            return null;
        }

        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType },
            });
            return blockBlobClient.url;
        } catch (error) {
            logger.error('Failed to upload file to blob storage', { error, filename });
            throw error;
        }
    }

    /** Delete a file from blob storage */
    async deleteFile(filename: string): Promise<void> {
        if (!this.containerClient) return;

        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
            await blockBlobClient.deleteIfExists();
        } catch (error) {
            logger.error('Failed to delete file from blob storage', { error, filename });
        }
    }

    isConnected(): boolean {
        return this.containerClient !== null;
    }
}

export const storageService = new StorageService();
