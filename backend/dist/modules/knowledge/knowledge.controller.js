"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeController = exports.KnowledgeController = void 0;
const knowledge_service_1 = require("./knowledge.service");
/** Knowledge Base controller */
class KnowledgeController {
    /** GET /api/knowledge — list documents */
    async getDocuments(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
            const result = await knowledge_service_1.knowledgeService.getDocuments(page, pageSize);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/knowledge/upload — upload document */
    async uploadDocument(req, res, next) {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: 'No file uploaded' });
                return;
            }
            const doc = await knowledge_service_1.knowledgeService.uploadDocument(req.file, req.user.userId);
            res.status(201).json({ success: true, data: doc, message: 'Document uploaded successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    /** PUT /api/knowledge/:id — update document */
    async updateDocument(req, res, next) {
        try {
            const doc = await knowledge_service_1.knowledgeService.updateDocument(req.params.id, req.body);
            res.json({ success: true, data: doc });
        }
        catch (error) {
            next(error);
        }
    }
    /** DELETE /api/knowledge/:id — delete document */
    async deleteDocument(req, res, next) {
        try {
            await knowledge_service_1.knowledgeService.deleteDocument(req.params.id);
            res.json({ success: true, message: 'Document deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/knowledge/:id/index — trigger indexing */
    async triggerIndexing(req, res, next) {
        try {
            const doc = await knowledge_service_1.knowledgeService.triggerIndexing(req.params.id);
            res.json({ success: true, data: doc, message: 'Indexing triggered' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.KnowledgeController = KnowledgeController;
exports.knowledgeController = new KnowledgeController();
//# sourceMappingURL=knowledge.controller.js.map