"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).max(100),
    value: zod_1.z.any(),
    description: zod_1.z.string().optional().default(''),
});
const updateSettingSchema = zod_1.z.object({
    value: zod_1.z.any(),
});
router.use(auth_1.authMiddleware);
router.get('/', (req, res, next) => settings_controller_1.settingsController.getAllSettings(req, res, next));
router.get('/:key', (req, res, next) => settings_controller_1.settingsController.getSetting(req, res, next));
router.post('/', (0, validate_1.validateBody)(createSettingSchema), (req, res, next) => settings_controller_1.settingsController.createSetting(req, res, next));
router.put('/:key', (0, validate_1.validateBody)(updateSettingSchema), (req, res, next) => settings_controller_1.settingsController.updateSetting(req, res, next));
router.delete('/:key', (req, res, next) => settings_controller_1.settingsController.deleteSetting(req, res, next));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map