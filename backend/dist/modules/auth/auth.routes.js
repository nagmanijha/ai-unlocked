"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
/** Zod schemas for input validation */
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    role: zod_1.z.enum(['admin', 'viewer']).optional().default('admin'),
});
// Public routes
router.post('/login', (0, validate_1.validateBody)(loginSchema), (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.post('/register', (0, validate_1.validateBody)(registerSchema), (req, res, next) => auth_controller_1.authController.register(req, res, next));
// Protected routes
router.get('/me', auth_1.authMiddleware, (req, res, next) => auth_controller_1.authController.getProfile(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map