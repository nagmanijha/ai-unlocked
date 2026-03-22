import { Request, Response, NextFunction } from 'express';
/**
 * Centralized error handling middleware.
 * Converts all errors to a consistent JSON response format.
 * Logs unexpected errors for debugging.
 */
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map