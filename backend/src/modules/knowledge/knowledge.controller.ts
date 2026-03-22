import { Request, Response, NextFunction } from 'express';
import { knowledgeService } from './knowledge.service';
import { ApiResponse } from '../../shared/types';

/** Knowledge Base controller */
export class KnowledgeController {
    /** GET /api/knowledge — list documents */
    async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
            const result = await knowledgeService.getDocuments(page, pageSize);

            res.json({ success: true, data: result } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/knowledge/upload — upload document */
    async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: 'No file uploaded' });
                return;
            }

            const doc = await knowledgeService.uploadDocument(req.file as any, req.user!.userId);
            res.status(201).json({ success: true, data: doc, message: 'Document uploaded successfully' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** PUT /api/knowledge/:id — update document */
    async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doc = await knowledgeService.updateDocument(req.params.id, req.body);
            res.json({ success: true, data: doc } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** DELETE /api/knowledge/:id — delete document */
    async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await knowledgeService.deleteDocument(req.params.id);
            res.json({ success: true, message: 'Document deleted successfully' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/knowledge/:id/index — trigger indexing */
    async triggerIndexing(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doc = await knowledgeService.triggerIndexing(req.params.id);
            res.json({ success: true, data: doc, message: 'Indexing triggered' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }
}

export const knowledgeController = new KnowledgeController();
