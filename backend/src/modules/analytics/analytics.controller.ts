import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../shared/types';

/** Analytics controller — serves dashboard metrics, charts data, and CSV exports */
export class AnalyticsController {
    /** GET /api/analytics/overview */
    async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await analyticsService.getOverview();
            res.json({ success: true, data } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/analytics/call-volume */
    async getCallVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const days = parseInt(req.query.days as string) || 30;
            const data = await analyticsService.getCallVolume(days);
            res.json({ success: true, data } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/analytics/languages */
    async getLanguageDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await analyticsService.getLanguageDistribution();
            res.json({ success: true, data } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/analytics/top-questions */
    async getTopQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await analyticsService.getTopQuestions();
            res.json({ success: true, data } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/analytics/export?type=call-volume|languages|top-questions */
    async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const type = req.query.type as string || 'call-volume';
            const csv = await analyticsService.exportCSV(type);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=askbox-${type}-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csv);
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();
