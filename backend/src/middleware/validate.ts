import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../shared/errors';

/**
 * Request validation middleware using Zod schemas.
 * Validates the request body against the provided schema.
 */
export function validateBody(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error: any) {
            const message = error.errors
                ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
                : 'Invalid request body';
            next(new BadRequestError(message));
        }
    };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (error: any) {
            const message = error.errors
                ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
                : 'Invalid query parameters';
            next(new BadRequestError(message));
        }
    };
}
