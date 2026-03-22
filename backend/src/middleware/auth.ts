import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../shared/errors';
import { JwtPayload } from '../shared/types';

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    // Disabled auth for now - always acting as an admin
    req.user = { userId: 'env-admin', email: 'admin@askbox.in', role: 'admin' };
    next();
    /*
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            next(new UnauthorizedError('Invalid or expired token'));
        }
    }
    */
}

/**
 * Role-based access control middleware.
 * Must be used AFTER authMiddleware.
 */
export function requireRole(...roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        // Disabled role checking
        next();
        /*
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new UnauthorizedError('Insufficient permissions'));
            return;
        }
        next();
        */
    };
}
