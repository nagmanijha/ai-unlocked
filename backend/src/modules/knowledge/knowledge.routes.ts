import { Router } from 'express';
import multer from 'multer';
import { knowledgeController } from './knowledge.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Configure multer for file uploads (max 50MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, TXT, and DOC/DOCX files are allowed'));
        }
    },
});

// All routes require authentication
router.use(authMiddleware);

router.get('/', (req, res, next) => knowledgeController.getDocuments(req, res, next));
router.post('/upload', upload.single('document'), (req, res, next) => knowledgeController.uploadDocument(req, res, next));
router.put('/:id', (req, res, next) => knowledgeController.updateDocument(req, res, next));
router.delete('/:id', (req, res, next) => knowledgeController.deleteDocument(req, res, next));
router.post('/:id/index', (req, res, next) => knowledgeController.triggerIndexing(req, res, next));

export default router;
