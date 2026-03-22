"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
/** Analytics controller — serves dashboard metrics, charts data, and CSV exports */
class AnalyticsController {
    /** GET /api/analytics/overview */
    async getOverview(req, res, next) {
        try {
            const data = await analytics_service_1.analyticsService.getOverview();
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/analytics/call-volume */
    async getCallVolume(req, res, next) {
        try {
            const days = parseInt(req.query.days) || 30;
            const data = await analytics_service_1.analyticsService.getCallVolume(days);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/analytics/languages */
    async getLanguageDistribution(req, res, next) {
        try {
            const data = await analytics_service_1.analyticsService.getLanguageDistribution();
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/analytics/top-questions */
    async getTopQuestions(req, res, next) {
        try {
            const data = await analytics_service_1.analyticsService.getTopQuestions();
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/analytics/export?type=call-volume|languages|top-questions */
    async exportCSV(req, res, next) {
        try {
            const type = req.query.type || 'call-volume';
            const csv = await analytics_service_1.analyticsService.exportCSV(type);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=askbox-${type}-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csv);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analytics.controller.js.map