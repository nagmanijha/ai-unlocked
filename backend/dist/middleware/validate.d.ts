import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Request validation middleware using Zod schemas.
 * Validates the request body against the provided schema.
 */
export declare function validateBody(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validates query parameters against a Zod schema.
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map