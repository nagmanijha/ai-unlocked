import { Request, Response, NextFunction } from 'express';
/** Calls controller — handles HTTP request/response for call log endpoints */
export declare class CallsController {
    /** GET /api/calls — paginated call list with filters */
    getCalls(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/calls/active — real-time active call count */
    getActiveCalls(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/calls/:id — full call detail */
    getCallById(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const callsController: CallsController;
//# sourceMappingURL=calls.controller.d.ts.map