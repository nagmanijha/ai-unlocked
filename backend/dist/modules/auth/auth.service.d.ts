import { AdminUser } from '../../shared/types';
/** Authentication service — handles user signup, login, and token generation */
export declare class AuthService {
    /** Register a new admin user */
    register(email: string, password: string, name: string, role?: string): Promise<AdminUser>;
    /** Authenticate user and return JWT */
    login(email: string, password: string): Promise<{
        user: AdminUser;
        token: string;
    }>;
    /** Get user by ID */
    getUserById(id: string): Promise<AdminUser>;
    /** Map a database row to AdminUser type */
    private mapRow;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map