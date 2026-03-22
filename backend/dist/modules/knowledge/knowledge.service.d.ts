import { KnowledgeDocument, PaginatedResponse } from '../../shared/types';
/**
 * Knowledge Base service — manages document metadata in PostgreSQL,
 * file storage in Azure Blob Storage, and indexing via Azure AI Search.
 */
export declare class KnowledgeService {
    /** List all documents with pagination */
    getDocuments(page?: number, pageSize?: number): Promise<PaginatedResponse<KnowledgeDocument>>;
    /** Upload a new document */
    uploadDocument(file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }, uploadedBy: string): Promise<KnowledgeDocument>;
    /** Update document metadata */
    updateDocument(id: string, updates: Partial<{
        originalName: string;
        indexingStatus: string;
    }>): Promise<KnowledgeDocument>;
    /** Delete a document */
    deleteDocument(id: string): Promise<void>;
    /** Trigger Azure AI Search indexing for a document */
    triggerIndexing(id: string): Promise<KnowledgeDocument>;
    /** Map database row to KnowledgeDocument */
    private mapRow;
}
export declare const knowledgeService: KnowledgeService;
//# sourceMappingURL=knowledge.service.d.ts.map