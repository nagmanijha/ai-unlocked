import { Request, Response, NextFunction } from 'express';
/** Authentication controller — handles HTTP request/response for auth endpoints */
export declare class AuthController {
    /** POST /api/auth/login */
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /api/auth/register */
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/auth/me */
    getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map