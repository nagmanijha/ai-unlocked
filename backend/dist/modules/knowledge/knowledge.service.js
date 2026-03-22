"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeService = exports.KnowledgeService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../shared/errors");
const storageClient_1 = require("../../azure/storageClient");
const logger_1 = require("../../config/logger");
const uuid_1 = require("uuid");
/**
 * Knowledge Base service — manages document metadata in PostgreSQL,
 * file storage in Azure Blob Storage, and indexing via Azure AI Search.
 */
class KnowledgeService {
    /** List all documents with pagination */
    async getDocuments(page = 1, pageSize = 20) {
        const offset = (page - 1) * pageSize;
        const countResult = await connection_1.pool.query('SELECT COUNT(*) FROM knowledge_base_documents');
        const total = parseInt(countResult.rows[0].count, 10);
        const result = await connection_1.pool.query(`SELECT * FROM knowledge_base_documents ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [pageSize, offset]);
        return {
            items: result.rows.map(this.mapRow),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    /** Upload a new document */
    async uploadDocument(file, uploadedBy) {
        const docId = (0, uuid_1.v4)();
        const filename = `${docId}-${file.originalname}`;
        // Upload to Azure Blob Storage (or skip if not configured)
        let storageUrl = null;
        try {
            storageUrl = await storageClient_1.storageService.uploadFile(filename, file.buffer, file.mimetype);
        }
        catch (error) {
            logger_1.logger.warn('Blob upload skipped — storage not configured');
        }
        const result = await connection_1.pool.query(`INSERT INTO knowledge_base_documents (id, filename, original_name, file_size, mime_type, storage_url, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [docId, filename, file.originalname, file.size, file.mimetype, storageUrl, uploadedBy]);
        return this.mapRow(result.rows[0]);
    }
    /** Update document metadata */
    async updateDocument(id, updates) {
        const setClauses = ['updated_at = NOW()'];
        const values = [];
        let paramIndex = 1;
        if (updates.originalName) {
            setClauses.push(`original_name = $${paramIndex}`);
            values.push(updates.originalName);
            paramIndex++;
        }
        if (updates.indexingStatus) {
            setClauses.push(`indexing_status = $${paramIndex}`);
            values.push(updates.indexingStatus);
            paramIndex++;
        }
        values.push(id);
        const result = await connection_1.pool.query(`UPDATE knowledge_base_documents SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Document not found');
        }
        return this.mapRow(result.rows[0]);
    }
    /** Delete a document */
    async deleteDocument(id) {
        const result = await connection_1.pool.query('SELECT filename FROM knowledge_base_documents WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('Document not found');
        }
        // Delete from blob storage
        await storageClient_1.storageService.deleteFile(result.rows[0].filename);
        // Delete from database
        await connection_1.pool.query('DELETE FROM knowledge_base_documents WHERE id = $1', [id]);
    }
    /** Trigger Azure AI Search indexing for a document */
    async triggerIndexing(id) {
        // Update status to "indexing"
        const doc = await this.updateDocument(id, { indexingStatus: 'indexing' });
        // In production, trigger Azure AI Search indexer here:
        // const indexerClient = new SearchIndexerClient(endpoint, credential);
        // await indexerClient.runIndexer('askbox-indexer');
        logger_1.logger.info('Indexing triggered for document', { documentId: id });
        // Simulate indexing completion after a delay (in production, use a webhook or polling)
        setTimeout(async () => {
            try {
                await this.updateDocument(id, { indexingStatus: 'indexed' });
                logger_1.logger.info('Document indexing completed', { documentId: id });
            }
            catch (error) {
                logger_1.logger.error('Failed to update indexing status', { error, documentId: id });
            }
        }, 5000);
        return doc;
    }
    /** Map database row to KnowledgeDocument */
    mapRow(row) {
        return {
            id: row.id,
            filename: row.filename,
            originalName: row.original_name,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            storageUrl: row.storage_url,
            indexingStatus: row.indexing_status,
            uploadedBy: row.uploaded_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.KnowledgeService = KnowledgeService;
exports.knowledgeService = new KnowledgeService();
//# sourceMappingURL=knowledge.service.js.map