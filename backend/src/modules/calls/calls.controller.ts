import { Request, Response, NextFunction } from 'express';
import { callsService } from './calls.service';
import { ApiResponse } from '../../shared/types';

/** Calls controller — handles HTTP request/response for call log endpoints */
export class CallsController {
    /** GET /api/calls — paginated call list with filters */
    async getCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
            const filters = {
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                language: req.query.language as string,
                status: req.query.status as string,
            };

            const result = await callsService.getCalls(page, pageSize, filters);

            const response: ApiResponse = {
                success: true,
                data: result,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/calls/active — real-time active call count */
    async getActiveCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const count = await callsService.getActiveCallCount();

            const response: ApiResponse = {
                success: true,
                data: { activeCount: count },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/calls/:id — full call detail */
    async getCallById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const call = await callsService.getCallById(req.params.id);

            if (!call) {
                res.status(404).json({ success: false, error: 'Call not found' });
                return;
            }

            const response: ApiResponse = {
                success: true,
                data: call,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const callsController = new CallsController();
