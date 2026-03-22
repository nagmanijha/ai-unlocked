"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callsController = exports.CallsController = void 0;
const calls_service_1 = require("./calls.service");
/** Calls controller — handles HTTP request/response for call log endpoints */
class CallsController {
    /** GET /api/calls — paginated call list with filters */
    async getCalls(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                language: req.query.language,
                status: req.query.status,
            };
            const result = await calls_service_1.callsService.getCalls(page, pageSize, filters);
            const response = {
                success: true,
                data: result,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/calls/active — real-time active call count */
    async getActiveCalls(req, res, next) {
        try {
            const count = await calls_service_1.callsService.getActiveCallCount();
            const response = {
                success: true,
                data: { activeCount: count },
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/calls/:id — full call detail */
    async getCallById(req, res, next) {
        try {
            const call = await calls_service_1.callsService.getCallById(req.params.id);
            if (!call) {
                res.status(404).json({ success: false, error: 'Call not found' });
                return;
            }
            const response = {
                success: true,
                data: call,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CallsController = CallsController;
exports.callsController = new CallsController();
//# sourceMappingURL=calls.controller.js.map