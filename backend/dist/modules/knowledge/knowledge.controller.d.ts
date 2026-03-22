import { Request, Response, NextFunction } from 'express';
/** Knowledge Base controller */
export declare class KnowledgeController {
    /** GET /api/knowledge — list documents */
    getDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /api/knowledge/upload — upload document */
    uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PUT /api/knowledge/:id — update document */
    updateDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** DELETE /api/knowledge/:id — delete document */
    deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /api/knowledge/:id/index — trigger indexing */
    triggerIndexing(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const knowledgeController: KnowledgeController;
//# sourceMappingURL=knowledge.controller.d.ts.map