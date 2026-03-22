import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const createSettingSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.any(),
    description: z.string().optional().default(''),
});

const updateSettingSchema = z.object({
    value: z.any(),
});

router.use(authMiddleware);

router.get('/', (req, res, next) => settingsController.getAllSettings(req, res, next));
router.get('/:key', (req, res, next) => settingsController.getSetting(req, res, next));
router.post('/', validateBody(createSettingSchema), (req, res, next) => settingsController.createSetting(req, res, next));
router.put('/:key', validateBody(updateSettingSchema), (req, res, next) => settingsController.updateSetting(req, res, next));
router.delete('/:key', (req, res, next) => settingsController.deleteSetting(req, res, next));

export default router;
