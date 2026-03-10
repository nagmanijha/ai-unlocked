import { pool } from '../../database/connection';
import { User } from '../../shared/types';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

/** Authentication service — handles user signup, login, and token generation */
export class AuthService {
    /** Register a new user */
    async register(email: string, password: string, name: string): Promise<User> {
        try {
            const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                throw new ConflictError('User with this email already exists');
            }
            const passwordHash = await bcrypt.hash(password, 12);
            const result = await pool.query(
                `INSERT INTO admin_users (email, password_hash, name, role)
             VALUES ($1, $2, $3, 'admin')
             RETURNING id, email, name, created_at, updated_at`,
                [email, passwordHash, name]
            );
            return this.mapRow(result.rows[0]);
        } catch (error: any) {
            if (error instanceof ConflictError) throw error;
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error('Database not available. Please set up PostgreSQL to enable registration.');
            }
            throw error;
        }
    }

    /** Authenticate user and return JWT */
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            const result = await pool.query(
                'SELECT id, email, password_hash, name, created_at, updated_at FROM admin_users WHERE email = $1',
                [email]
            );
            if (result.rows.length === 0) {
                throw new UnauthorizedError('Invalid email or password');
            }
            const row = result.rows[0];
            const isValid = await bcrypt.compare(password, row.password_hash);
            if (!isValid) {
                throw new UnauthorizedError('Invalid email or password');
            }
            const user = this.mapRow(row);
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn } as any
            );
            return { user, token };
        } catch (error: any) {
            if (error instanceof UnauthorizedError) throw error;
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error('Database not available. Please set up PostgreSQL to enable login.');
            }
            throw error;
        }
    }

    /** Get user by ID */
    async getUserById(id: string): Promise<User> {
        const result = await pool.query(
            'SELECT id, email, name, created_at, updated_at FROM admin_users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('User not found');
        }

        return this.mapRow(result.rows[0]);
    }

    /** Map a database row to User type */
    private mapRow(row: any): User {
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}

export const authService = new AuthService();
