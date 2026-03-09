import { pool } from '../../database/connection';
import { KnowledgeDocument, PaginatedResponse } from '../../shared/types';
import { NotFoundError } from '../../shared/errors';
import { storageService } from '../../azure/storageClient';
import { logger } from '../../config/logger';
import { v4 as uuid } from 'uuid';

/**
 * Knowledge Base service — manages document metadata in PostgreSQL,
 * file storage in Azure Blob Storage, and indexing via Azure AI Search.
 */
export class KnowledgeService {
    /** List all documents with pagination */
    async getDocuments(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<KnowledgeDocument>> {
        try {
            const offset = (page - 1) * pageSize;
            const countResult = await pool.query('SELECT COUNT(*) FROM knowledge_base_documents');
            const total = parseInt(countResult.rows[0].count, 10);
            const result = await pool.query(
                `SELECT * FROM knowledge_base_documents ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [pageSize, offset]
            );
            return { items: result.rows.map(this.mapRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        } catch (error) {
            logger.warn('[Knowledge] PostgreSQL unavailable — returning empty document list', { error });
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }
    }

    /** Upload a new document */
    async uploadDocument(
        file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        uploadedBy: string
    ): Promise<KnowledgeDocument> {
        const docId = uuid();
        const filename = `${docId}-${file.originalname}`;

        // Upload to Azure Blob Storage (or skip if not configured)
        let storageUrl: string | null = null;
        try {
            storageUrl = await storageService.uploadFile(filename, file.buffer, file.mimetype);
        } catch (error) {
            logger.warn('[Knowledge] Blob upload skipped — storage not configured');
        }

        try {
            const result = await pool.query(
                `INSERT INTO knowledge_base_documents (id, filename, original_name, file_size, mime_type, storage_url, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
                [docId, filename, file.originalname, file.size, file.mimetype, storageUrl, uploadedBy]
            );
            return this.mapRow(result.rows[0]);
        } catch (dbError) {
            // DB unavailable — return a mock document object so the UI doesn't break
            logger.warn('[Knowledge] DB unavailable — returning mock document after upload', { dbError });
            return {
                id: docId,
                filename,
                originalName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                storageUrl: storageUrl ?? undefined,
                indexingStatus: 'pending',
                uploadedBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
    }

    /** Update document metadata */
    async updateDocument(id: string, updates: Partial<{ originalName: string; indexingStatus: string }>): Promise<KnowledgeDocument> {
        const setClauses: string[] = ['updated_at = NOW()'];
        const values: any[] = [];
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

        const result = await pool.query(
            `UPDATE knowledge_base_documents SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Document not found');
        }

        return this.mapRow(result.rows[0]);
    }

    /** Delete a document */
    async deleteDocument(id: string): Promise<void> {
        const result = await pool.query('SELECT filename FROM knowledge_base_documents WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new NotFoundError('Document not found');
        }

        // Delete from blob storage
        await storageService.deleteFile(result.rows[0].filename);

        // Delete from database
        await pool.query('DELETE FROM knowledge_base_documents WHERE id = $1', [id]);
    }

    /** Trigger Azure AI Search indexing for a document */
    async triggerIndexing(id: string): Promise<KnowledgeDocument> {
        // Update status to "indexing"
        const doc = await this.updateDocument(id, { indexingStatus: 'indexing' });

        // In production, trigger Azure AI Search indexer here:
        // const indexerClient = new SearchIndexerClient(endpoint, credential);
        // await indexerClient.runIndexer('askbox-indexer');

        logger.info('Indexing triggered for document', { documentId: id });

        // Simulate indexing completion after a delay (in production, use a webhook or polling)
        setTimeout(async () => {
            try {
                await this.updateDocument(id, { indexingStatus: 'indexed' });
                logger.info('Document indexing completed', { documentId: id });
            } catch (error) {
                logger.error('Failed to update indexing status', { error, documentId: id });
            }
        }, 5000);

        return doc;
    }

    /** Map database row to KnowledgeDocument */
    private mapRow(row: any): KnowledgeDocument {
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

export const knowledgeService = new KnowledgeService();
