"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("./auth.service");
const config_1 = require("../../config");
/** Authentication controller — handles HTTP request/response for auth endpoints */
class AuthController {
    /** POST /api/auth/login */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            // Short-circuit fallback check: if ENV credentials match, bypass DB
            const fallbackEmail = process.env.ADMIN_EMAIL || 'admin@askbox.in';
            const fallbackPassword = process.env.ADMIN_PASSWORD || 'askbox';
            if (email === fallbackEmail && password === fallbackPassword) {
                const token = jsonwebtoken_1.default.sign({ userId: 'env-admin', email, role: 'admin' }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
                res.json({
                    success: true,
                    data: {
                        user: { id: 'env-admin', email, name: 'Setup Admin', role: 'admin' },
                        token,
                    },
                    message: 'Fallback Login successful',
                });
                return;
            }
            const result = await auth_service_1.authService.login(email, password);
            const response = {
                success: true,
                data: result,
                message: 'Login successful',
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/auth/register */
    async register(req, res, next) {
        try {
            const { email, password, name, role } = req.body;
            const user = await auth_service_1.authService.register(email, password, name, role);
            const response = {
                success: true,
                data: user,
                message: 'User registered successfully',
            };
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/auth/me */
    async getProfile(req, res, next) {
        try {
            const user = await auth_service_1.authService.getUserById(req.user.userId);
            const response = {
                success: true,
                data: user,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map