import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/call-volume', (req, res, next) => analyticsController.getCallVolume(req, res, next));
router.get('/languages', (req, res, next) => analyticsController.getLanguageDistribution(req, res, next));
router.get('/top-questions', (req, res, next) => analyticsController.getTopQuestions(req, res, next));
router.get('/export', (req, res, next) => analyticsController.exportCSV(req, res, next));

export default router;
