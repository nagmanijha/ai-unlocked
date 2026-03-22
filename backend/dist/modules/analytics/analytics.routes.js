"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/overview', (req, res, next) => analytics_controller_1.analyticsController.getOverview(req, res, next));
router.get('/call-volume', (req, res, next) => analytics_controller_1.analyticsController.getCallVolume(req, res, next));
router.get('/languages', (req, res, next) => analytics_controller_1.analyticsController.getLanguageDistribution(req, res, next));
router.get('/top-questions', (req, res, next) => analytics_controller_1.analyticsController.getTopQuestions(req, res, next));
router.get('/export', (req, res, next) => analytics_controller_1.analyticsController.exportCSV(req, res, next));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map