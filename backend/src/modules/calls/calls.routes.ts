import { Router } from 'express';
import { callsController } from './calls.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// All call routes require authentication
router.use(authMiddleware);

router.get('/', (req, res, next) => callsController.getCalls(req, res, next));
router.get('/active', (req, res, next) => callsController.getActiveCalls(req, res, next));
router.get('/:id', (req, res, next) => callsController.getCallById(req, res, next));

export default router;
