import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../shared/types';

/** Authentication controller — handles HTTP request/response for auth endpoints */
export class AuthController {
    /** POST /api/auth/login */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            const response: ApiResponse = {
                success: true,
                data: result,
                message: 'Login successful',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/auth/register */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name } = req.body;
            const user = await authService.register(email, password, name);

            const response: ApiResponse = {
                success: true,
                data: user,
                message: 'User registered successfully',
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/auth/me */
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await authService.getUserById(req.user!.userId);

            const response: ApiResponse = {
                success: true,
                data: user,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
