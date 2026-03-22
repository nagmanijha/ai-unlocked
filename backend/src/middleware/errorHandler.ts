import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../shared/errors';
import { ApiResponse } from '../shared/types';

/**
 * Centralized error handling middleware.
 * Converts all errors to a consistent JSON response format.
 * Logs unexpected errors for debugging.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Handle known operational errors
    if (err instanceof AppError) {
        const response: ApiResponse = {
            success: false,
            error: err.message,
        };
        res.status(err.statusCode).json(response);
        return;
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const response: ApiResponse = {
            success: false,
            error: 'Validation error',
            message: err.message,
        };
        res.status(400).json(response);
        return;
    }

    // Log unexpected errors
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });

    // Send generic error in production
    const response: ApiResponse = {
        success: false,
        error:
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
    };
    res.status(500).json(response);
}
