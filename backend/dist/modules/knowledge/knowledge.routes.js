"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const knowledge_controller_1 = require("./knowledge.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for file uploads (max 50MB)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, TXT, and DOC/DOCX files are allowed'));
        }
    },
});
// All routes require authentication
router.use(auth_1.authMiddleware);
router.get('/', (req, res, next) => knowledge_controller_1.knowledgeController.getDocuments(req, res, next));
router.post('/upload', upload.single('document'), (req, res, next) => knowledge_controller_1.knowledgeController.uploadDocument(req, res, next));
router.put('/:id', (req, res, next) => knowledge_controller_1.knowledgeController.updateDocument(req, res, next));
router.delete('/:id', (req, res, next) => knowledge_controller_1.knowledgeController.deleteDocument(req, res, next));
router.post('/:id/index', (req, res, next) => knowledge_controller_1.knowledgeController.triggerIndexing(req, res, next));
exports.default = router;
//# sourceMappingURL=knowledge.routes.js.map