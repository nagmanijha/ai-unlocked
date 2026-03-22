import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

/** Zod schemas for input validation */
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Public routes
router.post('/login', validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/register', validateBody(registerSchema), (req, res, next) => authController.register(req, res, next));

// Protected routes
router.get('/me', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));

export default router;
