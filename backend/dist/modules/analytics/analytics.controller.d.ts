import { Request, Response, NextFunction } from 'express';
/** Analytics controller — serves dashboard metrics, charts data, and CSV exports */
export declare class AnalyticsController {
    /** GET /api/analytics/overview */
    getOverview(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/analytics/call-volume */
    getCallVolume(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/analytics/languages */
    getLanguageDistribution(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/analytics/top-questions */
    getTopQuestions(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/analytics/export?type=call-volume|languages|top-questions */
    exportCSV(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const analyticsController: AnalyticsController;
//# sourceMappingURL=analytics.controller.d.ts.map