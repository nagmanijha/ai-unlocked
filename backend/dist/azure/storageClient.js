"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const config_1 = require("../config");
const logger_1 = require("../config/logger");
/**
 * Azure Blob Storage client wrapper.
 * Used for uploading knowledge base documents.
 *
 * NOTE: Replace placeholder credentials with real Azure Storage credentials.
 */
class StorageService {
    constructor() {
        this.containerClient = null;
    }
    /** Initialize Blob Storage client. Call once at startup. */
    async initialize() {
        if (!config_1.config.storage.connectionString) {
            logger_1.logger.warn('Azure Storage credentials not configured — uploads will use local storage');
            return;
        }
        try {
            const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(config_1.config.storage.connectionString);
            this.containerClient = blobServiceClient.getContainerClient(config_1.config.storage.containerName);
            await this.containerClient.createIfNotExists({ access: 'blob' });
            logger_1.logger.info('Azure Blob Storage client initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Azure Blob Storage', { error });
        }
    }
    /** Upload a file to blob storage and return the URL */
    async uploadFile(filename, buffer, contentType) {
        if (!this.containerClient) {
            logger_1.logger.warn('Storage not configured — skipping blob upload');
            return null;
        }
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType },
            });
            return blockBlobClient.url;
        }
        catch (error) {
            logger_1.logger.error('Failed to upload file to blob storage', { error, filename });
            throw error;
        }
    }
    /** Delete a file from blob storage */
    async deleteFile(filename) {
        if (!this.containerClient)
            return;
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
            await blockBlobClient.deleteIfExists();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete file from blob storage', { error, filename });
        }
    }
    isConnected() {
        return this.containerClient !== null;
    }
}
exports.storageService = new StorageService();
//# sourceMappingURL=storageClient.js.map