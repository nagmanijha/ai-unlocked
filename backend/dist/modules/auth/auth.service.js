"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../shared/errors");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
/** Authentication service — handles user signup, login, and token generation */
class AuthService {
    /** Register a new admin user */
    async register(email, password, name, role = 'admin') {
        // Check for existing user
        const existing = await connection_1.pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const result = await connection_1.pool.query(`INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at, updated_at`, [email, passwordHash, name, role]);
        return this.mapRow(result.rows[0]);
    }
    /** Authenticate user and return JWT */
    async login(email, password) {
        const result = await connection_1.pool.query('SELECT id, email, password_hash, name, role, created_at, updated_at FROM admin_users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const row = result.rows[0];
        const isValid = await bcryptjs_1.default.compare(password, row.password_hash);
        if (!isValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const user = this.mapRow(row);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        return { user, token };
    }
    /** Get user by ID */
    async getUserById(id) {
        const result = await connection_1.pool.query('SELECT id, email, name, role, created_at, updated_at FROM admin_users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return this.mapRow(result.rows[0]);
    }
    /** Map a database row to AdminUser type */
    mapRow(row) {
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map