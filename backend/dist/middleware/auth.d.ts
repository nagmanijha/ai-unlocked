import { Request, Response, NextFunction } from 'express';
/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user.
 */
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Role-based access control middleware.
 * Must be used AFTER authMiddleware.
 */
export declare function requireRole(...roles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map